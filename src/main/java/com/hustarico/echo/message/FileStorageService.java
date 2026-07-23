package com.hustarico.echo.message;


import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String uploadPath = "./uploads/";


    public String saveFile(MultipartFile file) throws IOException {

        if(file.isEmpty()) return null;

        File directory = new File(uploadPath);

        if(!directory.exists()){
            directory.mkdirs();
        }

        String fileName = file.getOriginalFilename();
        String extension = "";
        if(fileName!=null && fileName.contains(".")){
            extension = fileName.substring(fileName.lastIndexOf("."));
        }

        String uniqueFileName = UUID.randomUUID().toString()+extension;

        Path targetPath = Paths.get(uploadPath+uniqueFileName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/"+uniqueFileName;


    }



}
