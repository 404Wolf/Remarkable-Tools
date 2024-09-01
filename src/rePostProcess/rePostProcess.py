import argparse

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def apply_curve(img):
    # Convert image to numpy array
    img_array = np.array(img)

    # Create lookup table. The x axis is all possible 16 bit gray colors, and the
    # y axis is what they map to.
    x = np.linspace(0, 65535, 65536)
    # for example, 2949 -> 0
    y = np.interp(x, [0, 5700, 7680, 65535], [0, 59000, 65535, 65535])
    lut = np.clip(y, 0, 65535).astype(np.uint16)

    # Apply lookup table
    img_curved = np.interp(img_array, x, lut).astype(np.uint16)

    # Convert back to PIL Image
    return Image.fromarray(img_curved, mode="I;16")


def add_border_to_image(img):
    """Add a black border to the input image"""
    border_size = 4
    border_color = (0, 0, 0)
    return ImageOps.expand(img, border=border_size, fill=border_color)


def expand_bounding_box(bbox, padding, max_size):
    """Expand the bounding box of the image by padding pixels"""
    # Expand the bounding box by padding pixels
    # left, upper, right, lower
    bbox = (
        max(bbox[0] - padding, 0),
        max(bbox[1] - padding, 0),
        min(bbox[2] + padding, max_size[0]),
        min(bbox[3] + padding, max_size[1]),
    )

    return bbox


def remove_dotted_background(img, blur_radius=10, block_size=20, padding=100):
    """Get boundry box discounting dots and lines and marks"""
    # Apply a blur to the image
    filtered_image = img.filter(ImageFilter.GaussianBlur(blur_radius))

    # Resize the image to be small to get pixel blocks, then resize back
    original_img_size = filtered_image.size
    filtered_image = filtered_image.resize(
        (filtered_image.size[0] // block_size, filtered_image.size[1] // block_size),
        Image.Resampling.NEAREST,
    )
    filtered_image = filtered_image.resize(original_img_size, Image.Resampling.NEAREST)

    colorized_image = filtered_image.convert("L")
    colorized_image = ImageOps.colorize(
        colorized_image,
        (0, 0, 0),
        (255, 255, 255),
        blackpoint=50,
        whitepoint=240,
    )

    img = img.convert("RGB")

    # Brighten image slightly and reduce contrast
    # Since some pixels might be like, (255, 255, 254)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(0.9)
    enhancer = ImageEnhance.Brightness(filtered_image)
    filtered_image = enhancer.enhance(1.05)

    # Crop the image
    bbox = ImageOps.invert(filtered_image).getbbox()
    bbox = expand_bounding_box(bbox, padding, original_img_size)

    return img.crop(bbox)


def is_landscape(data):
    return np.all(data[1820, 34] == [0, 0, 0])


def cleanup_image(path, crop):
    """Clean up a remarkable screenshot. Remove artifacts like menu and compass"""
    # Load image, discard alpha (if present)
    img = Image.open(path)
    img = apply_curve(img)
    img_array = np.array(img)
    img_normalized = (img_array / 256).astype("uint8")
    img = Image.fromarray(np.stack((img_normalized,) * 3, axis=-1))

    # Remove menu and indicators
    data = np.array(img)

    if is_landscape(data):
        # Remove the menu and x
        if np.all(data[1829, 1324]):
            data[1782 : img.height, 0 : img.width] = [255, 255, 255]
            data[20:80, 20:80] = [255, 255, 255]

        # Rotate the image
        data = np.rot90(data, 3)
        img = Image.fromarray(data).convert("RGB")
    else:
        if np.all(data[1840, 37] == [0, 0, 0]):
            # Remove the menu and x
            data[:, :120, :] = 255
            data[40:81, 1324:1364, :] = 255
        else:
            # Remove only the menu indicator circle
            data[40:81, 40:81, :] = 255

        # Remove the compass from the top left
        data[25:79, 30:79] = [255, 255, 255]

        # Remove the close button from the top right
        data[33:73, 1332:1372] = [255, 255, 255]

        # Remove page range
        data[1820:1851, 590:806] = [255, 255, 255]

    # Crop to the bounding box
    img = Image.fromarray(data).convert("RGB")
    if crop:
        img = remove_dotted_background(img)

    # Set alpha channel
    data = np.array(img.convert("RGBA"))

    # Copy inverted red channel to alpha channel, so that the background is transparent
    # (could have also used blue or green here, doesn't matter)
    data[..., -1] = 255 - data[..., 0]
    return Image.fromarray(data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean up an image.")
    parser.add_argument("path", help="Path to the image file.")
    parser.add_argument("--crop", action="store_true", help="Crop the image.")
    args = parser.parse_args()

    img = cleanup_image(args.path, args.crop)
    img.save(args.path)
