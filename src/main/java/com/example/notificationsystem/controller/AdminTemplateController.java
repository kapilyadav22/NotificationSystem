package com.example.notificationsystem.controller;

import com.example.notificationsystem.dto.TemplateResponse;
import com.example.notificationsystem.dto.TemplateUpsertRequest;
import com.example.notificationsystem.model.Channel;
import com.example.notificationsystem.service.TemplateService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/templates")
public class AdminTemplateController {

    private final TemplateService templateService;

    public AdminTemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @PutMapping
    public TemplateResponse upsert(@Valid @RequestBody TemplateUpsertRequest request) {
        return templateService.upsert(request);
    }

    @GetMapping
    public List<TemplateResponse> list() {
        return templateService.list();
    }

    @GetMapping("/{templateId}")
    public TemplateResponse get(
            @PathVariable String templateId,
            @RequestParam("channel") Channel channel
    ) {
        return templateService.get(templateId, channel);
    }
}
