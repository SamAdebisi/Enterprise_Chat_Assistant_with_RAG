import pytest
from unittest.mock import patch, MagicMock
from app.llm import generate

class TestLLMGeneration:
    @patch('app.llm.client')
    def test_successful_generation(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "AI is artificial intelligence"
        mock_client.chat.completions.create.return_value = mock_response
        
        result = generate("What is AI?", "Context about AI")
        
        assert result == "AI is artificial intelligence"
        mock_client.chat.completions.create.assert_called_once()
        
        # Check the call arguments
        call_args = mock_client.chat.completions.create.call_args
        assert call_args[1]["model"] == "gpt-4o-mini"
        assert call_args[1]["temperature"] == 0.2
        assert call_args[1]["max_tokens"] == 1000
        assert len(call_args[1]["messages"]) == 2
        assert call_args[1]["messages"][0]["role"] == "system"
        assert call_args[1]["messages"][1]["role"] == "user"

    @patch('app.llm.client')
    def test_empty_question(self, mock_client):
        with pytest.raises(ValueError, match="Question cannot be empty"):
            generate("", "Context")

    @patch('app.llm.client')
    def test_empty_context(self, mock_client):
        result = generate("What is AI?", "")
        assert result == "I don't have enough information to answer this question."

    @patch('app.llm.client')
    def test_whitespace_only_question(self, mock_client):
        with pytest.raises(ValueError, match="Question cannot be empty"):
            generate("   ", "Context")

    @patch('app.llm.client')
    def test_whitespace_only_context(self, mock_client):
        result = generate("What is AI?", "   ")
        assert result == "I don't have enough information to answer this question."

    @patch('app.llm.client')
    def test_empty_response_from_openai(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = None
        mock_client.chat.completions.create.return_value = mock_response
        
        result = generate("What is AI?", "Context about AI")
        
        assert result == "I don't know."

    @patch('app.llm.client')
    def test_openai_api_error(self, mock_client):
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        
        result = generate("What is AI?", "Context about AI")
        
        assert "I encountered an error while generating an answer" in result
        assert "API Error" in result

    @patch('app.llm.client')
    def test_network_error(self, mock_client):
        mock_client.chat.completions.create.side_effect = ConnectionError("Network error")
        
        result = generate("What is AI?", "Context about AI")
        
        assert "I encountered an error while generating an answer" in result
        assert "Network error" in result

    @patch('app.llm.client')
    def test_message_formatting(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test answer"
        mock_client.chat.completions.create.return_value = mock_response
        
        generate("What is AI?", "Context about AI")
        
        # Check that messages are properly formatted
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]["messages"]
        
        # System message
        assert messages[0]["role"] == "system"
        assert "helpful assistant" in messages[0]["content"]
        assert "cite your sources" in messages[0]["content"]
        
        # User message
        assert messages[1]["role"] == "user"
        user_content = messages[1]["content"]
        assert "Question:" in user_content
        assert "What is AI?" in user_content
        assert "Context:" in user_content
        assert "Context about AI" in user_content
        assert "Answer succinctly with citations" in user_content

    @patch('app.llm.client')
    def test_long_question_truncation_in_logs(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test answer"
        mock_client.chat.completions.create.return_value = mock_response
        
        long_question = "What is " + "AI " * 50  # Very long question
        generate(long_question, "Context")
        
        # The function should still work with long questions
        mock_client.chat.completions.create.assert_called_once()

    @patch('app.llm.client')
    def test_long_context_handling(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test answer"
        mock_client.chat.completions.create.return_value = mock_response
        
        long_context = "Context " * 1000  # Very long context
        generate("What is AI?", long_context)
        
        # The function should handle long context
        mock_client.chat.completions.create.assert_called_once()

    @patch('app.llm.client')
    def test_special_characters_in_question(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test answer"
        mock_client.chat.completions.create.return_value = mock_response
        
        special_question = "What is AI? 🚀 \n\n Special chars: @#$%^&*()"
        generate(special_question, "Context")
        
        # Should handle special characters without issues
        mock_client.chat.completions.create.assert_called_once()

    @patch('app.llm.client')
    def test_unicode_content(self, mock_client):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test answer"
        mock_client.chat.completions.create.return_value = mock_response
        
        unicode_question = "What is AI? 人工智能"
        unicode_context = "Context with 中文 characters"
        generate(unicode_question, unicode_context)
        
        # Should handle unicode without issues
        mock_client.chat.completions.create.assert_called_once()
