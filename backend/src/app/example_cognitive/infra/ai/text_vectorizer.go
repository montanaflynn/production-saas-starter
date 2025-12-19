package ai

import (
	"context"

	"github.com/moasq/backend/app/example_cognitive/domain"
	llmdomain "github.com/moasq/backend/pkg/llm/domain"
)

const embeddingModel = "text-embedding-3-small"

type openAITextVectorizer struct {
	llmClient llmdomain.LLMClient
}

func NewTextVectorizer(llmClient llmdomain.LLMClient) domain.TextVectorizer {
	return &openAITextVectorizer{llmClient: llmClient}
}

func (v *openAITextVectorizer) Vectorize(ctx context.Context, text string) ([]float64, error) {
	return v.llmClient.GenerateEmbedding(ctx, text, embeddingModel)
}
