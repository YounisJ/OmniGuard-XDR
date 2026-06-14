import torch
import torch.nn as nn

class HostLSTM(nn.Module):
    """
    LSTM architecture for sequential system call traces (e.g., ADFA-IDS).
    Takes in sequences of system call IDs and predicts anomalies.
    """
    def __init__(self, vocab_size: int, embedding_dim: int = 32, hidden_dim: int = 64, num_classes: int = 2):
        super(HostLSTM, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True, dropout=0.2, num_layers=2)
        self.classifier = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # x shape: (batch, seq_len)
        embedded = self.embedding(x)
        
        # lstm_out shape: (batch, seq_len, hidden_dim)
        lstm_out, (hidden, cell) = self.lstm(embedded)
        
        # Take the hidden state of the last layer
        last_hidden = hidden[-1, :, :]
        
        logits = self.classifier(last_hidden)
        return logits
