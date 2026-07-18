package com.hustarico.echo.message;

import com.hustarico.echo.user.User;
import com.hustarico.echo.user.UserNotFoundException;
import com.hustarico.echo.user.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;


    public MessageDTO createMessage(MessageRequest messageRequest, String senderUsername){
        User sender = userRepository.findByUsername(senderUsername).orElseThrow(()-> new UserNotFoundException("user "+ senderUsername + "not found!"));

        return createMessage(messageRequest, sender.getId());
    }


    public MessageDTO createMessage(MessageRequest messageRequest, int senderId ){


        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findByUsername(messageRequest.sentTo()).orElseThrow(()->
                new UserNotFoundException("user "+messageRequest.sentTo()+ "not found!")
        );

        Message message = Message.builder()
                .text(messageRequest.text())
                .sender(sender)
                .receiver(receiver)
                .sentAt(LocalDateTime.now())
                .build();


        messageRepository.save(message);
        return new MessageDTO(message.getId(),
                message.getSender().getUsername(),
                message.getReceiver().getUsername() ,
                message.getText(),
                message.getSentAt());
    }


    public List<MessageDTO> getMessages(String username, String otherUserUsername){


        User user = userRepository.findByUsername(username).orElseThrow(()->
                new UserNotFoundException("user "+username+ "not found!"));

        User otherUser = username.equals(otherUserUsername)? user : userRepository.findByUsername(otherUserUsername).orElseThrow(()->
                new UserNotFoundException("user "+otherUserUsername+ "not found!"));

        List<Message> messages = username.equals(otherUserUsername)?
                messageRepository.findBySenderAndReceiverOrderBySentAtAsc(user,otherUser):
                messageRepository.findBySenderAndReceiverOrSenderAndReceiverOrderBySentAtAsc(user,otherUser,otherUser,user);
        return messages.stream().map(message ->
                new MessageDTO(
                        message.getId(),
                        message.getSender().getUsername(),
                        message.getReceiver().getUsername(),
                        message.getText(),
                        message.getSentAt())
        ).toList();
    }



}
