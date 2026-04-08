package com.example.notificationsystem.service;

import com.example.notificationsystem.dto.TemplateResponse;
import com.example.notificationsystem.dto.TemplateUpsertRequest;
import com.example.notificationsystem.entity.NotificationTemplate;
import com.example.notificationsystem.exception.TemplateNotFoundException;
import com.example.notificationsystem.model.Channel;
import com.example.notificationsystem.repository.NotificationTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TemplateService {

    private final NotificationTemplateRepository templateRepository;

    public TemplateService(NotificationTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Transactional
    public TemplateResponse upsert(TemplateUpsertRequest request) {
        NotificationTemplate template = templateRepository.findByTemplateIdAndChannel(
                        request.getTemplateId(),
                        request.getChannel()
                )
                .orElseGet(NotificationTemplate::new);
        template.setTemplateId(request.getTemplateId());
        template.setChannel(request.getChannel());
        template.setContent(request.getContent());
        templateRepository.save(template);
        return toResponse(template);
    }

    @Transactional(readOnly = true)
    public TemplateResponse get(String templateId, Channel channel) {
        NotificationTemplate template = getEntity(templateId, channel);
        return toResponse(template);
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> list() {
        return templateRepository.findAllByOrderByTemplateIdAscChannelAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public String resolveTemplateContent(String templateId, Channel channel) {
        return getEntity(templateId, channel).getContent();
    }

    private NotificationTemplate getEntity(String templateId, Channel channel) {
        return templateRepository.findByTemplateIdAndChannel(templateId, channel)
                .orElseThrow(() -> new TemplateNotFoundException(templateId, channel));
    }

    private TemplateResponse toResponse(NotificationTemplate template) {
        return new TemplateResponse(
                template.getId(),
                template.getTemplateId(),
                template.getChannel(),
                template.getContent(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
