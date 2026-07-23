package com.hustarico.echo.message;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageRequest(@Size(min = 1, max= 50) String text, @NotBlank String sentTo, String imageUrl) {


}
