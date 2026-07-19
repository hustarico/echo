package com.hustarico.echo.message;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageRequest(@NotBlank @Size(min = 1, max= 10) String text, String sentTo) {


}
