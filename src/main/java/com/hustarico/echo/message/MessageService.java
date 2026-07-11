package com.hustarico.echo.message;

import com.hustarico.echo.user.User;
import com.hustarico.echo.user.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Data
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public void createMessage(MessageRequest messageRequest, int senderId){

        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findByUsername(messageRequest.sentTo()).orElseThrow();

        Message message = Message.builder()
                .text(messageRequest.text())
                .sender(sender)
                .receiver(receiver)
                .sentAt(LocalDateTime.now())
                .build();


        messageRepository.save(message);
    }


    public List<Message> getMessages(int userId, int otherUserId){
        User user = userRepository.findById(userId).orElseThrow();
        User otherUser = userRepository.findById(otherUserId).orElseThrow();
        return messageRepository.findBySenderAndReceiverOrSenderAndReceiverOrderBySentAtAsc(user,otherUser,otherUser,user);
    }



}
