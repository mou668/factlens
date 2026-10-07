import unittest

from fastapi import HTTPException

from app.main import MAX_IMAGE_BYTES, validate_uploaded_image


class ImageUploadValidationTests(unittest.TestCase):
    def test_accepts_png_signature(self):
        self.assertEqual(validate_uploaded_image(b"\x89PNG\r\n\x1a\npayload", "image/png"), "image/png")

    def test_rejects_non_image_content(self):
        with self.assertRaises(HTTPException) as error:
            validate_uploaded_image(b"not an image", "image/png")
        self.assertEqual(error.exception.status_code, 415)

    def test_rejects_mismatched_content_type(self):
        with self.assertRaises(HTTPException) as error:
            validate_uploaded_image(b"\xff\xd8\xffpayload", "image/png")
        self.assertEqual(error.exception.status_code, 415)

    def test_rejects_empty_image(self):
        with self.assertRaises(HTTPException) as error:
            validate_uploaded_image(b"", "image/png")
        self.assertEqual(error.exception.status_code, 400)

    def test_rejects_image_over_size_limit(self):
        with self.assertRaises(HTTPException) as error:
            validate_uploaded_image(b"\x89PNG\r\n\x1a\n" + b"x" * MAX_IMAGE_BYTES, "image/png")
        self.assertEqual(error.exception.status_code, 413)


if __name__ == "__main__":
    unittest.main()
