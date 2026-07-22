# learn-codex-harness

面向开发者和 Agent 学习者的 Codex CLI 学习研究项目。项目以可运行、可验证、强可视化的资料和实验，解释 Codex Agent Harness 的关键设计，并提炼对科研智能体 Harness 的启发。

## 固定研究基线

当前第一期内容固定基于 OpenAI 官方 Codex 仓库的以下版本：

| 项目 | 值 |
| --- | --- |
| 上游仓库 | `https://github.com/openai/codex` |
| 发布版本 | `0.145.0` |
| Git tag | `rust-v0.145.0` |
| 固定提交 | `25af12f7e61572b0bc18ddb1008be543b91519b0` |
| 提交日期 | `2026-07-21` |
| 本地源码快照 | `D:\learn-Agent\upstream\openai-codex\rust-v0.145.0` |

上游源码快照与本项目分离保存，不会被提交到本仓库。第一期的源码定位、架构说明、运行轨迹和最小实验均以这份快照为准。

可用以下命令核验本地快照：

```powershell
git -C D:\learn-Agent\upstream\openai-codex\rust-v0.145.0 rev-parse HEAD
git -C D:\learn-Agent\upstream\openai-codex\rust-v0.145.0 describe --tags --exact-match
```

未来跟进新版时，会建立新的研究基线和版本差异记录，不会静默混用不同版本的结论。
