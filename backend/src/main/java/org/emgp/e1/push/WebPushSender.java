package org.emgp.e1.push;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPrivateKeySpec;
import java.security.spec.ECPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Minimal Web Push client using only the JDK: RFC 8291 payload encryption (aes128gcm) and RFC 8292 VAPID.
 */
public final class WebPushSender {

    public record Subscription(String endpoint, String p256dh, String auth) {}

    private static final int MAX_PAYLOAD = 3900;
    private static final ECParameterSpec P256 = curve();
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ECPrivateKey vapidPrivateKey;
    private final String vapidPublicKey;
    private final String subject;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    /** @throws IllegalArgumentException if the VAPID keys are not a valid base64url P-256 pair */
    public WebPushSender(String vapidPublicKey, String vapidPrivateKey, String subject) {
        try {
            publicKey(decode(vapidPublicKey));
            this.vapidPrivateKey = (ECPrivateKey) KeyFactory.getInstance("EC")
                    .generatePrivate(new ECPrivateKeySpec(new BigInteger(1, decode(vapidPrivateKey)), P256));
        } catch (GeneralSecurityException e) {
            throw new IllegalArgumentException("Invalid VAPID keys", e);
        }
        this.vapidPublicKey = vapidPublicKey;
        this.subject = subject;
    }

    /** @return the HTTP status returned by the push service (201 when accepted, 404/410 when the subscription is gone) */
    public int send(Subscription subscription, byte[] payload, int ttlSeconds) throws IOException, InterruptedException {
        try {
            KeyPair ephemeral = newKeyPair();
            byte[] salt = new byte[16];
            RANDOM.nextBytes(salt);
            byte[] body = encrypt(payload, decode(subscription.p256dh()), decode(subscription.auth()), ephemeral, salt);

            HttpRequest request = HttpRequest.newBuilder(URI.create(subscription.endpoint()))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Encoding", "aes128gcm")
                    .header("Content-Type", "application/octet-stream")
                    .header("TTL", Integer.toString(ttlSeconds))
                    .header("Urgency", "high")
                    .header("Authorization", vapidAuthorization(subscription.endpoint(), Instant.now().getEpochSecond()))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
            return http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IOException("Web Push encryption failed: " + e.getMessage(), e);
        }
    }

    String vapidAuthorization(String endpoint, long nowSeconds) throws GeneralSecurityException {
        URI uri = URI.create(endpoint);
        String audience = uri.getScheme() + "://" + uri.getAuthority();
        String signingInput = encode("{\"typ\":\"JWT\",\"alg\":\"ES256\"}".getBytes(StandardCharsets.UTF_8)) + "."
                + encode(("{\"aud\":\"" + json(audience) + "\",\"exp\":" + (nowSeconds + 12 * 3600)
                        + ",\"sub\":\"" + json(subject) + "\"}").getBytes(StandardCharsets.UTF_8));
        Signature signature = Signature.getInstance("SHA256withECDSAinP1363Format");
        signature.initSign(vapidPrivateKey);
        signature.update(signingInput.getBytes(StandardCharsets.UTF_8));
        return "vapid t=" + signingInput + "." + encode(signature.sign()) + ", k=" + vapidPublicKey;
    }

    /** Single-record aes128gcm body: salt | record size | key id length | sender public key | ciphertext. */
    static byte[] encrypt(byte[] payload, byte[] uaPublic, byte[] authSecret, KeyPair sender, byte[] salt)
            throws GeneralSecurityException {
        if (payload.length > MAX_PAYLOAD) {
            throw new IllegalArgumentException("Payload too large");
        }
        byte[] senderPublic = encodePoint((ECPublicKey) sender.getPublic());

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(sender.getPrivate());
        agreement.doPhase(publicKey(uaPublic), true);
        byte[] shared = agreement.generateSecret();

        byte[] keyInfo = concat(ascii("WebPush: info\0"), uaPublic, senderPublic);
        byte[] ikm = hkdf(authSecret, shared, keyInfo, 32);
        byte[] cek = hkdf(salt, ikm, ascii("Content-Encoding: aes128gcm\0"), 16);
        byte[] nonce = hkdf(salt, ikm, ascii("Content-Encoding: nonce\0"), 12);

        byte[] record = Arrays.copyOf(payload, payload.length + 1);
        record[payload.length] = 2;
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] ciphertext = cipher.doFinal(record);

        return ByteBuffer.allocate(16 + 4 + 1 + 65 + ciphertext.length)
                .put(salt).putInt(4096).put((byte) 65).put(senderPublic).put(ciphertext)
                .array();
    }

    private static byte[] hkdf(byte[] salt, byte[] ikm, byte[] info, int length) throws GeneralSecurityException {
        byte[] prk = hmac(salt, ikm);
        return Arrays.copyOf(hmac(prk, info, new byte[] {1}), length);
    }

    private static byte[] hmac(byte[] key, byte[]... data) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        for (byte[] part : data) {
            mac.update(part);
        }
        return mac.doFinal();
    }

    private static KeyPair newKeyPair() throws GeneralSecurityException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    private static ECPublicKey publicKey(byte[] raw) throws GeneralSecurityException {
        if (raw.length != 65 || raw[0] != 4) {
            throw new IllegalArgumentException("Not an uncompressed P-256 public key");
        }
        ECPoint point = new ECPoint(new BigInteger(1, Arrays.copyOfRange(raw, 1, 33)),
                new BigInteger(1, Arrays.copyOfRange(raw, 33, 65)));
        return (ECPublicKey) KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, P256));
    }

    private static byte[] encodePoint(ECPublicKey key) {
        byte[] out = new byte[65];
        out[0] = 4;
        System.arraycopy(fixed32(key.getW().getAffineX()), 0, out, 1, 32);
        System.arraycopy(fixed32(key.getW().getAffineY()), 0, out, 33, 32);
        return out;
    }

    private static byte[] fixed32(BigInteger value) {
        byte[] bytes = value.toByteArray();
        byte[] out = new byte[32];
        int length = Math.min(bytes.length, 32);
        System.arraycopy(bytes, bytes.length - length, out, 32 - length, length);
        return out;
    }

    private static ECParameterSpec curve() {
        try {
            AlgorithmParameters parameters = AlgorithmParameters.getInstance("EC");
            parameters.init(new ECGenParameterSpec("secp256r1"));
            return parameters.getParameterSpec(ECParameterSpec.class);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("P-256 is not available", e);
        }
    }

    private static byte[] concat(byte[]... parts) {
        int length = 0;
        for (byte[] part : parts) {
            length += part.length;
        }
        byte[] out = new byte[length];
        int offset = 0;
        for (byte[] part : parts) {
            System.arraycopy(part, 0, out, offset, part.length);
            offset += part.length;
        }
        return out;
    }

    private static byte[] ascii(String value) {
        return value.getBytes(StandardCharsets.US_ASCII);
    }

    private static byte[] decode(String base64Url) {
        return Base64.getUrlDecoder().decode(base64Url);
    }

    private static String encode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String json(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
