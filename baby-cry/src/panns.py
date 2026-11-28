"""Minimal PANNs model definitions (Kong et al. 2020, github.com/qiuqiangkong/audioset_tagging_cnn, MIT)."""
import torch, torch.nn as nn, torch.nn.functional as F
from torchlibrosa.stft import Spectrogram, LogmelFilterBank

def init_layer(l):
    nn.init.xavier_uniform_(l.weight)
    if getattr(l, 'bias', None) is not None: l.bias.data.fill_(0.)

class ConvBlock(nn.Module):
    def __init__(s, i, o):
        super().__init__()
        s.conv1 = nn.Conv2d(i, o, 3, 1, 1, bias=False); s.conv2 = nn.Conv2d(o, o, 3, 1, 1, bias=False)
        s.bn1 = nn.BatchNorm2d(o); s.bn2 = nn.BatchNorm2d(o)
    def forward(s, x, pool_size=(2, 2)):
        x = F.relu_(s.bn1(s.conv1(x))); x = F.relu_(s.bn2(s.conv2(x)))
        return F.avg_pool2d(x, kernel_size=pool_size)

class Frontend(nn.Module):
    def __init__(s, sr, win, hop, mels, fmin, fmax):
        super().__init__()
        s.spectrogram_extractor = Spectrogram(n_fft=win, hop_length=hop, win_length=win, window='hann', center=True, pad_mode='reflect', freeze_parameters=True)
        s.logmel_extractor = LogmelFilterBank(sr=sr, n_fft=win, n_mels=mels, fmin=fmin, fmax=fmax, ref=1.0, amin=1e-10, top_db=None, freeze_parameters=True)

class Cnn14_16k(nn.Module):
    def __init__(s, classes_num=527):
        super().__init__()
        fr = Frontend(16000, 512, 160, 64, 50, 8000)
        s.spectrogram_extractor, s.logmel_extractor = fr.spectrogram_extractor, fr.logmel_extractor
        s.bn0 = nn.BatchNorm2d(64)
        chans = [1, 64, 128, 256, 512, 1024, 2048]
        for k in range(6): setattr(s, f'conv_block{k+1}', ConvBlock(chans[k], chans[k + 1]))
        s.fc1 = nn.Linear(2048, 2048); s.fc_audioset = nn.Linear(2048, classes_num)
    def forward(s, wav):
        x = s.logmel_extractor(s.spectrogram_extractor(wav))  # (B,1,T,64)
        x = s.bn0(x.transpose(1, 3)).transpose(1, 3)
        for k in range(6):
            x = getattr(s, f'conv_block{k+1}')(x, pool_size=(2, 2) if k < 5 else (1, 1))
        x = x.mean(3); x = x.max(2)[0] + x.mean(2)
        emb = F.relu_(s.fc1(x))
        return {'embedding': emb, 'clipwise_output': torch.sigmoid(s.fc_audioset(emb))}

class MobileNetV1(nn.Module):
    def __init__(s, classes_num=527):
        super().__init__()
        fr = Frontend(32000, 1024, 320, 64, 50, 14000)
        s.spectrogram_extractor, s.logmel_extractor = fr.spectrogram_extractor, fr.logmel_extractor
        s.bn0 = nn.BatchNorm2d(64)
        def conv_bn(i, o, st): return nn.Sequential(nn.Conv2d(i, o, 3, 1, 1, bias=False), nn.AvgPool2d(st), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        def conv_dw(i, o, st): return nn.Sequential(nn.Conv2d(i, i, 3, 1, 1, groups=i, bias=False), nn.AvgPool2d(st), nn.BatchNorm2d(i), nn.ReLU(inplace=True),
                                                    nn.Conv2d(i, o, 1, 1, 0, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        s.features = nn.Sequential(conv_bn(1, 32, 2), conv_dw(32, 64, 1), conv_dw(64, 128, 2), conv_dw(128, 128, 1), conv_dw(128, 256, 2),
                                   conv_dw(256, 256, 1), conv_dw(256, 512, 2), *[conv_dw(512, 512, 1) for _ in range(5)],
                                   conv_dw(512, 1024, 2), conv_dw(1024, 1024, 1))
        s.fc1 = nn.Linear(1024, 1024); s.fc_audioset = nn.Linear(1024, classes_num)
    def forward(s, wav):
        x = s.logmel_extractor(s.spectrogram_extractor(wav))
        x = s.bn0(x.transpose(1, 3)).transpose(1, 3)
        x = s.features(x)
        x = x.mean(3); x = x.max(2)[0] + x.mean(2)
        emb = F.relu_(s.fc1(x))
        return {'embedding': emb, 'clipwise_output': torch.sigmoid(s.fc_audioset(emb))}

def load_ckpt(path):
    import numpy as np
    from numpy._core.multiarray import _reconstruct, scalar
    g = [(_reconstruct, 'numpy.core.multiarray._reconstruct'), (scalar, 'numpy.core.multiarray.scalar'), np.ndarray, np.dtype,
         type(np.dtype('float32')), type(np.dtype('float64')), type(np.dtype('int64'))]
    with torch.serialization.safe_globals(g):
        sd = torch.load(path, map_location='cpu', weights_only=True)
    return sd['model'] if 'model' in sd else sd
