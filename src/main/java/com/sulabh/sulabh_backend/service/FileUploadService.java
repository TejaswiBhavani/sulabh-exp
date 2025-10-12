package com.sulabh.sulabh_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileUploadService {
    
    @Value("${file.upload.directory:${user.home}/sulabh-uploads}")
    private String uploadDirectory;
    
    @Value("${file.upload.max-size:10485760}") // 10MB default
    private long maxFileSize;
    
    private final List<String> allowedExtensions = List.of(
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", // Images
        ".pdf", ".doc", ".docx", ".txt", ".rtf", // Documents
        ".mp4", ".avi", ".mov", ".wmv", ".webm", // Videos
        ".mp3", ".wav", ".aac", ".ogg" // Audio
    );
    
    private final List<String> allowedMimeTypes = List.of(
        "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp",
        "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain", "application/rtf",
        "video/mp4", "video/avi", "video/quicktime", "video/x-ms-wmv", "video/webm",
        "audio/mpeg", "audio/wav", "audio/aac", "audio/ogg"
    );
    
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        // Validate file
        validateFile(file);
        
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDirectory, folder);
        Files.createDirectories(uploadPath);
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Return relative path for storage in database
        return folder + "/" + uniqueFilename;
    }
    
    public List<String> uploadMultipleFiles(List<MultipartFile> files, String folder) throws IOException {
        List<String> uploadedPaths = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String path = uploadFile(file, folder);
                uploadedPaths.add(path);
            }
        }
        
        return uploadedPaths;
    }
    
    public void deleteFile(String filePath) throws IOException {
        Path path = Paths.get(uploadDirectory, filePath);
        Files.deleteIfExists(path);
    }
    
    public Path getFilePath(String relativePath) {
        return Paths.get(uploadDirectory, relativePath);
    }
    
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of " + maxFileSize + " bytes");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Filename is null");
        }
        
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("File type not allowed: " + extension);
        }
        
        String mimeType = file.getContentType();
        if (mimeType == null || !allowedMimeTypes.contains(mimeType)) {
            throw new IllegalArgumentException("MIME type not allowed: " + mimeType);
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
    
    public boolean isValidFileType(MultipartFile file) {
        try {
            validateFile(file);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}