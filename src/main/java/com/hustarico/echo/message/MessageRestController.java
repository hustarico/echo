package com.hustarico.echo.message;


import com.hustarico.echo.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;
    private final FileStorageService fileStorageService;


    @PostMapping("")
    public ResponseEntity<String> sendMessage(@RequestBody @Valid MessageRequest messageRequest, @AuthenticationPrincipal User currentUser) {

        messageService.createMessage(messageRequest,currentUser.getId());
        return ResponseEntity.ok("message sent successfully!!");
    }

    @GetMapping("/history/{username}")
    public ResponseEntity<List<MessageDTO>> getHistory(@PathVariable String username, @AuthenticationPrincipal User currentUser){



        return ResponseEntity.ok(messageService.getMessages(currentUser.getUsername(),username ));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<MessageDTO>> getRecent(@AuthenticationPrincipal User currentUser){
        return ResponseEntity.ok(messageService.getRecentContacts(currentUser.getUsername()));
    }

    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<String> uploadImage(@RequestParam("image") MultipartFile imageFile) throws IOException {
        if (imageFile == null || imageFile.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String imageUrl = fileStorageService.saveFile(imageFile);
        return ResponseEntity.ok(imageUrl);
    }
}
