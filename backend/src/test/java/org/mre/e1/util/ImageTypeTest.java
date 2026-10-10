package org.mre.e1.util;

import org.junit.jupiter.api.Test;
import org.mre.e1.TestData;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageTypeTest {

    @Test
    void recognisesImagesFromTheirFirstBytes() {
        assertEquals(ImageType.PNG, ImageType.detect(TestData.PNG).orElseThrow());
        assertEquals(ImageType.JPEG, ImageType.detect(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0}).orElseThrow());
        assertEquals(ImageType.WEBP, ImageType.detect("RIFF\0\0\0\0WEBPVP8 ".getBytes()).orElseThrow());
    }

    @Test
    void neverTrustsAnythingElse() {
        assertTrue(ImageType.detect("<svg></svg>".getBytes()).isEmpty());
        assertTrue(ImageType.detect(new byte[0]).isEmpty());
    }
}
