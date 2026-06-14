import torch
import torch.nn as nn
import torch.nn.functional as F

class NetworkTransformer(nn.Module):
    """
    A Transformer encoder architecture for tabular network data (e.g. CIC-IDS2017).
    Projects numeric/categorical network statistics into embeddings and applies self-attention.
    """
    def __init__(self, input_dim: int, d_model: int = 64, nhead: int = 4, num_layers: int = 2, num_classes: int = 2):
        super(NetworkTransformer, self).__init__()
        self.input_projection = nn.Linear(input_dim, d_model)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=nhead, 
            dim_feedforward=d_model * 4, 
            dropout=0.1, 
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        self.fc_out = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, num_classes)
        )
        
    def forward(self, x):
        # x shape: (batch, seq_len, input_dim) - if treating packets as sequences
        # or (batch, input_dim) - if treating single packet as a sequence of 1
        if x.dim() == 2:
            x = x.unsqueeze(1) # shape: (batch, 1, d_model)
            
        embedded = self.input_projection(x)
        encoded = self.transformer_encoder(embedded)
        
        # Pool across sequence dimension (e.g., take the first token or mean)
        pooled = torch.mean(encoded, dim=1) 
        
        logits = self.fc_out(pooled)
        return logits
