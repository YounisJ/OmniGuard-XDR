import torch
import torch.nn as nn

class IoTAutoencoder(nn.Module):
    """
    Unsupervised Autoencoder for IoT telemetry (e.g., RT-IoT2022).
    Trains on benign traffic to minimize reconstruction error. High error = anomaly.
    """
    def __init__(self, input_dim: int, latent_dim: int = 16):
        super(IoTAutoencoder, self).__init__()
        
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.LeakyReLU(0.1),
            nn.Linear(64, 32),
            nn.LeakyReLU(0.1),
            nn.Linear(32, latent_dim)
        )
        
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 32),
            nn.LeakyReLU(0.1),
            nn.Linear(32, 64),
            nn.LeakyReLU(0.1),
            nn.Linear(64, input_dim)
        )
        
    def forward(self, x):
        latent = self.encoder(x)
        reconstructed = self.decoder(latent)
        return reconstructed
        
    def compute_anomaly_score(self, x):
        reconstructed = self.forward(x)
        mse_loss = torch.mean((x - reconstructed) ** 2, dim=1)
        return mse_loss
