package com.hustarico.echo.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<String> searchUser(String username){
        return userRepository.findByUsernameContainingIgnoreCase(username)
                .stream()
                .map(user -> user.getUsername())
                .toList();
    }
}
