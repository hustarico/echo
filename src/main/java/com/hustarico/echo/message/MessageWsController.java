package com.hustarico.echo.message;


import com.hustarico.echo.config.WebSocketService;
import com.hustarico.echo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class MessageWsController {

    private final MessageService messageService;
    private final WebSocketService webSocketService;


    @MessageMapping("/chat.private")
    public void sendMessage(MessageRequest messageRequest, Principal principal){
        MessageDTO messageDTO = messageService.createMessage(messageRequest, principal.getName());
        webSocketService.sendUserUpdate(messageRequest.sentTo(), messageDTO);
        webSocketService.sendUserUpdate(principal.getName(), messageDTO);
    }
}
