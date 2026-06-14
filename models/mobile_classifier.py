import torch
import torch.nn as nn

class MobileMalwareMLP(nn.Module):
    """
    Lightweight Multi-Layer Perceptron (MLP) for sparse binary features (e.g., Drebin Android dataset).
    """
    def __init__(self, input_dim: int, hidden_dims=[256, 128, 64], num_classes: int = 2):
        super(MobileMalwareMLP, self).__init__()
        
        layers = []
        prev_dim = input_dim
        for h_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, h_dim))
            layers.append(nn.BatchNorm1d(h_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(0.3))
            prev_dim = h_dim
            
        layers.append(nn.Linear(prev_dim, num_classes))
        self.network = nn.Sequential(*layers)
        
    def forward(self, x):
        return self.network(x)
