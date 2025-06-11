<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class SurveyImageService
{
    public function saveImage(string $imageData): string
    {
        if (!preg_match('/^data:image\/(jpeg|jpg|png|gif);base64,/', $imageData, $type)) {
            throw new \Exception('Invalid image format');
        }

        $imageData = substr($imageData, strpos($imageData, ',') + 1);
        $type = strtolower($type[1]);

        if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
            throw new \Exception('Invalid image type');
        }

        $imageData = str_replace(' ', '+', $imageData);
        $decodedImage = base64_decode($imageData);

        if ($decodedImage === false) {
            throw new \Exception('Failed to decode image');
        }

        if (strlen($decodedImage) > 5 * 1024 * 1024) {
            throw new \Exception('Image too large');
        }

        $filename = hash('sha256', $decodedImage . time()) . '.' . $type;
        $dir = 'images/';
        $relativePath = $dir . $filename;
        $absolutePath = public_path($dir);

        if (!File::exists($absolutePath)) {
            File::makeDirectory($absolutePath, 0755, true);
        }

        file_put_contents($absolutePath . $filename, $decodedImage);
        chmod($absolutePath . $filename, 0644);

        return $relativePath;
    }

    public function deleteImage(string $imagePath): void
    {
        $absolutePath = public_path($imagePath);
        if (File::exists($absolutePath)) {
            File::delete($absolutePath);
        }
    }
}
