package ai

import (
	"context"

	"github.com/moasq/backend/app/example_cognitive/domain"
	llmdomain "github.com/moasq/backend/pkg/llm/domain"
)

type openAIAssistantProvider struct {
	llmClient llmdomain.LLMClient
}

// NewAssistantProvider creates an AssistantProvider backed by OpenAI
func NewAssistantProvider(llmClient llmdomain.LLMClient) domain.AssistantProvider {
	return &openAIAssistantProvider{llmClient: llmClient}
}

func (p *openAIAssistantProvider) GenerateResponse(ctx context.Context, prompt string) (*domain.AssistantResponse, error) {
	req := llmdomain.CompletionRequest{Prompt: prompt}
	resp, err := p.llmClient.Complete(ctx, req)
	if err != nil {
		return nil, err
	}
	return &domain.AssistantResponse{
		Content:    resp.Text,
		TokensUsed: resp.TokensUsed,
	}, nil
}
