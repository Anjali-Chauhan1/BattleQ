# Rollup Context Directory

The `minitiad` binary is **NOT** stored in Git (it's ~102MB).

It is downloaded automatically during Docker build from:
https://github.com/initia-labs/minievm/releases

If you need a local copy for testing, run:
```bash
bash deploy/rollup/prepare.sh
```

## Contents after prepare.sh:
```
context/
├── minitiad          ← Linux binary (auto-downloaded in Docker)
└── .minitia/
    ├── config/
    │   ├── genesis.json
    │   ├── config.toml
    │   ├── app.toml
    │   └── ...
    └── data/         (optional)
```
