package com.hustarico.echo.message;

import com.hustarico.echo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("select m from Message m where m.id in ( " +
            "Select max(m2.id) from Message m2 where " +
            "m2.sender.username=:username or m2.receiver.username=:username " +
            "group by case when m2.sender.username=:username then m2.receiver.username " +
            "else m2.sender.username " +
            "end " +
            ") order by m.sentAt Desc")
    List<Message> findRecentMessages(
            @Param("username") String currentUser
    );
}
