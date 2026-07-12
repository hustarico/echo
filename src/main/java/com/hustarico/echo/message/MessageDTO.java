package com.hustarico.echo.message;

import java.time.LocalDateTime;

public record MessageDTO(int id, String senderUsername, String receiverUsername, String text, LocalDateTime sentAt) {
}
