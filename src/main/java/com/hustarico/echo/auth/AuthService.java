package com.hustarico.echo.auth;

import com.hustarico.echo.config.JwtService;
import com.hustarico.echo.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request){

        String cleanUsername = request.getUsername().trim();

        if(userRepository.existsByUsernameIgnoreCase(cleanUsername))
            throw new UsernameAlreadyExistsException("username "+cleanUsername+ " is taken, choose another one");

        User user = User.builder()
                .username(cleanUsername)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();
        userRepository.save(user);

        String jwt = jwtService.generateToken(user);

        return  AuthenticationResponse.builder()
                .jwt(jwt)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {

        String cleanUsername = request.getUsername().trim();

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(cleanUsername, request.getPassword()));

        User user = userRepository.findByUsername(cleanUsername).orElseThrow(()->new UserNotFoundException("Account doesn't exist"));

        String jwt = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .jwt(jwt)
                .build();
    }
}
