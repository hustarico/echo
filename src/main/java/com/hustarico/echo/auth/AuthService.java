package com.hustarico.echo.auth;

import com.hustarico.echo.config.JwtService;
import com.hustarico.echo.user.Role;
import com.hustarico.echo.user.User;
import com.hustarico.echo.user.UserRepository;
import com.hustarico.echo.user.UsernameAlreadyExistsException;
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

        if(userRepository.existsByUsernameIgnoreCase(request.getUsername()))
            throw new UsernameAlreadyExistsException("username "+request.getUsername()+ " is taken, choose another one");

        User user = User.builder()
                .username(request.getUsername())
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

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        String jwt = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .jwt(jwt)
                .build();
    }
}
