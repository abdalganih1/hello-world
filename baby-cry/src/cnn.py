import torch, torch.nn as nn, torch.nn.functional as F
from panns import Frontend

class TinyCryCNN(nn.Module):
    """Edge-friendly log-mel CNN (~90k params). Input: raw 16 kHz waveform (B, N)."""
    def __init__(s, n_classes=5, width=24):
        super().__init__()
        fr = Frontend(16000, 512, 160, 64, 50, 8000)
        s.spec, s.mel = fr.spectrogram_extractor, fr.logmel_extractor
        s.bn0 = nn.BatchNorm2d(64)
        ch = [1, width, width * 2, width * 4, width * 4]
        s.blocks = nn.ModuleList()
        for i in range(4):
            s.blocks.append(nn.Sequential(nn.Conv2d(ch[i], ch[i + 1], 3, padding=1, bias=False), nn.BatchNorm2d(ch[i + 1]), nn.ReLU(),
                                          nn.Conv2d(ch[i + 1], ch[i + 1], 3, padding=1, groups=ch[i + 1], bias=False),
                                          nn.Conv2d(ch[i + 1], ch[i + 1], 1, bias=False), nn.BatchNorm2d(ch[i + 1]), nn.ReLU()))
        s.drop = nn.Dropout(0.3); s.fc = nn.Linear(ch[-1], n_classes)
    def raw_mel(s, wav):
        return s.mel(s.spec(wav))                 # (B,1,T,64)
    def forward(s, wav, specaug=False):
        return s.forward_mel(s.raw_mel(wav), specaug)
    def forward_mel(s, x, specaug=False):
        x = s.bn0(x.transpose(1, 3)).transpose(1, 3)
        if specaug and s.training:
            B, _, T, Fq = x.shape
            for _ in range(2):
                t0 = torch.randint(0, max(1, T - 40), (1,)).item(); x[:, :, t0:t0 + torch.randint(0, 40, (1,)).item()] = 0
                f0 = torch.randint(0, Fq - 8, (1,)).item(); x[:, :, :, f0:f0 + torch.randint(0, 8, (1,)).item()] = 0
        for i, b in enumerate(s.blocks):
            x = b(x)
            if i < 3: x = F.avg_pool2d(x, 2)
        x = x.mean(3); x = x.max(2)[0] + x.mean(2)
        return s.fc(s.drop(x))
