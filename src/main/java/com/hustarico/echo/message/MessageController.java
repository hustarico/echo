package com.hustarico.echo.message;


import com.hustarico.echo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;



    @PostMapping("")
    public ResponseEntity<String> sendMessage(@RequestBody MessageRequest messageRequest, @AuthenticationPrincipal User currentUser) {

        messageService.createMessage(messageRequest,currentUser.getId());
        return ResponseEntity.ok("message sent successfully!!");
    }

    @GetMapping("/history/{username}")
    public ResponseEntity<List<Message>> getHistory(@PathVariable String username, @AuthenticationPrincipal User currentUser){



        return ResponseEntity.ok(messageService.getMessages(currentUser.getUsername(),username ));
    }
}
