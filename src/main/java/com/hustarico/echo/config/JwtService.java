package com.hustarico.echo.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String secretKey = "452af32e25a174dcfcbcdf760a52a2645635e2bd0a3964f2b844b1ddd17a65d9";

    public String extractUsername(String jwt){

        return extractClaim(jwt,Claims::getSubject); 
    }


    public <T> T extractClaim(String jwt, Function<Claims,T> claimsResolver){
        final Claims claims = extractAllClaims(jwt);
        return claimsResolver.apply(claims);
    }



    public Claims extractAllClaims(String jwt){



        return Jwts
                .parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(jwt)
                .getPayload();
    }
    private SecretKey getSigningKey(){

        byte[] keyBytes = Decoders.BASE64.decode(secretKey);

        return Keys.hmacShaKeyFor(keyBytes);
    }
}
