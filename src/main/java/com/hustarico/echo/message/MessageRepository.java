package com.hustarico.echo.message;

import com.hustarico.echo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message,Integer> {

    List<Message> findBySenderAndReceiverOrSenderAndReceiverOrderBySentAtAsc(
            User senderA, User receiverA,
            User senderB, User receiverB
            );

    List<Message> findBySenderAndReceiverOrderBySentAtAsc(
            User sender,
            User receiver
    );
}
