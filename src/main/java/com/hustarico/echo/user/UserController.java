package com.hustarico.echo.user;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("users")
public class UserController {

    private final UserService userService;

    @GetMapping("/greet")
    public String greet(){
        return "supp g";
    }

    @GetMapping("/{name}")
    public List<String> searchUser(@PathVariable String name){
        return userService.searchUser(name);
    }
}
