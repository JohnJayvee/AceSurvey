<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SurveyImageService
{
    public function saveImage(string $imageData): string
    {
        if (strlen($imageData) > 7000000 || !preg_match('/^data:image\/(jpeg|jpg|png|gif);base64,/', $imageData, $matches)) {
            throw ValidationException::withMessages(['image' => 'Choose a JPEG, PNG or GIF image under 5 MB.']);
        }
        $decoded = base64_decode(substr($imageData, strpos($imageData, ',') + 1), true);
        $info = $decoded !== false ? @getimagesizefromstring($decoded) : false;
        $mime = $matches[1] === 'jpg' ? 'image/jpeg' : 'image/'.$matches[1];
        if ($decoded === false || strlen($decoded) > 5 * 1024 * 1024 || !$info || ($info['mime'] ?? '') !== $mime) {
            throw ValidationException::withMessages(['image' => 'The image is invalid or exceeds 5 MB.']);
        }

        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $relativePath = 'images/'.Str::uuid().'.'.$extension;
        File::ensureDirectoryExists(public_path('images'), 0755);
        if (File::put(public_path($relativePath), $decoded) === false) {
            throw new \RuntimeException('Unable to save survey image.');
        }
        return $relativePath;
    }

    public function deleteImage(string $imagePath): void
    {
        $directory = realpath(public_path('images'));
        $path = realpath(public_path($imagePath));
        if ($directory && $path && str_starts_with($path, $directory.DIRECTORY_SEPARATOR) && is_file($path)) {
            File::delete($path);
        }
    }
}
