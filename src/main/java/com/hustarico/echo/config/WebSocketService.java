package com.hustarico.echo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate template;

    public void sendUserUpdate(String username, Object payload){
        Map<String,Object> message = new HashMap<>();
        message.put("payload",payload);
        template.convertAndSendToUser(username, "/topic", message);
    }
}
