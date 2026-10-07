package org.emgp.e1.service;

import org.emgp.e1.util.ImageType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

/** Screenshots on disk, one flat folder. File names are generated here, never taken from the client. */
@Component
public class ProofStorage {

    private final Path root;

    public ProofStorage(@Value("${proofs.dir}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    public String store(byte[] data, ImageType type) throws IOException {
        Files.createDirectories(root);
        String fileName = UUID.randomUUID() + "." + type.extension();
        Files.write(root.resolve(fileName), data, StandardOpenOption.CREATE_NEW);
        return fileName;
    }

    public byte[] read(String fileName) throws IOException {
        return Files.readAllBytes(resolve(fileName));
    }

    public void deleteQuietly(String fileName) {
        try {
            Files.deleteIfExists(resolve(fileName));
        } catch (IOException | RuntimeException ignored) {
            // best effort cleanup
        }
    }

    private Path resolve(String fileName) {
        Path path = root.resolve(fileName).normalize();
        if (!root.equals(path.getParent())) {
            throw new IllegalArgumentException("Invalid file name");
        }
        return path;
    }
}
