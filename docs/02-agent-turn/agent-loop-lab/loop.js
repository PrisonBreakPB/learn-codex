(function () {
  const BASE_HISTORY = [
    {
      role: "system",
      text: "你是一个帮助开发者理解 Codex Agent Runtime 的助手。"
    },
    {
      role: "user",
      text: "请解释工具结果怎样进入下一次模型生成请求。"
    }
  ];

  const ROUNDS = [
    {
      toolCall: "list_files(docs/)",
      toolResult: "01-architecture/、02-agent-turn/、README.md"
    },
    {
      toolCall: "search_text(\"run_turn\")",
      toolResult: "定位到 core/src/session/turn.rs 中的 run_turn。"
    },
    {
      toolCall: "read_file(turn.rs: run_sampling_request)",
      toolResult: "提示词输入来自当前历史，并会经过 build_prompt 组装。"
    },
    {
      toolCall: "search_text(\"handle_output_item_done\")",
      toolResult: "工具调用项会由核心处理，并由工具运行时返回结果。"
    },
    {
      finalAnswer: "工具结果会追加到会话历史；同一个 run_turn 再次请求模型生成时，更新后的历史会参与提示词组装。"
    }
  ];

  const PHASES = [
    {
      node: "context",
      edge: "history-context",
      text: "把当前 History 整理成这一次模型生成请求可见的上下文。"
    },
    {
      node: "model",
      edge: "context-model",
      text: "模型根据已累积的上下文，决定继续调用工具还是直接回复。"
    },
    {
      node: "tool",
      edge: "model-tool",
      text: "工具调用被执行，运行结果等待写回会话历史。"
    },
    {
      node: "history",
      edge: "tool-history",
      text: "工具结果追加到 History，成为下一轮模型生成请求的新输入。"
    }
  ];

  const FINAL_PHASES = [
    PHASES[0],
    PHASES[1],
    {
      node: "history",
      edge: "tool-history",
      text: "模型输出最终回复并记录到 History；没有后续工具调用，当前 turn 完成。"
    }
  ];

  let currentRound = 0;
  let phaseIndex = 0;
  let phaseTimer = null;
  let autoplayTimer = null;

  function query(selector, root) {
    return (root || document).querySelector(selector);
  }

  function queryAll(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function historyForRound(roundIndex) {
    const entries = BASE_HISTORY.map((entry) => ({ ...entry, isNew: false }));

    ROUNDS.slice(0, roundIndex + 1).forEach((round, index) => {
      if (round.finalAnswer) {
        entries.push({
          role: "assistant",
          text: round.finalAnswer,
          isNew: index === roundIndex
        });
        return;
      }

      entries.push({
        role: "assistant",
        text: `tool_call: ${round.toolCall}`,
        isNew: index === roundIndex
      });
      entries.push({
        role: "tool",
        text: round.toolResult,
        isNew: index === roundIndex
      });
    });

    return entries;
  }

  function createHistoryEntry(entry) {
    const item = document.createElement("li");
    const role = document.createElement("span");
    const copy = document.createElement("span");

    item.className = "history-entry";
    item.dataset.role = entry.role;
    role.className = "history-role";
    role.textContent = entry.role;
    copy.className = "history-copy";
    copy.textContent = entry.text;
    item.append(role, copy);

    return item;
  }

  function renderHistory(root) {
    const entries = historyForRound(currentRound);
    const list = query(".history-list", root);

    query(".history-count", root).textContent = `${entries.length} 条消息`;

    while (list.children.length > entries.length) {
      list.lastElementChild.remove();
    }

    entries.forEach((entry, index) => {
      let item = list.children[index];

      if (!item) {
        item = createHistoryEntry(entry);
        list.append(item);
      }

      item.classList.toggle("is-new", entry.isNew);
    });
  }

  function renderToolbar(root) {
    query(".round-count", root).textContent = `第 ${currentRound + 1} / ${ROUNDS.length} 轮`;
    query('[data-action="previous"]', root).disabled = currentRound === 0;
  }

  function clearPhaseTimer() {
    if (phaseTimer) {
      clearInterval(phaseTimer);
      phaseTimer = null;
    }
  }

  function setCyclePhase(root, phases) {
    const phase = phases[phaseIndex % phases.length];

    queryAll(".loop-node", root).forEach((node) => {
      node.classList.toggle("is-active", node.dataset.node === phase.node);
      node.classList.toggle(
        "is-finished",
        currentRound === ROUNDS.length - 1 && node.dataset.node === "history"
      );
    });

    queryAll(".cycle-arrow", root).forEach((arrow) => {
      arrow.classList.toggle("is-active", arrow.dataset.edge === phase.edge);
    });

    query(".cycle-caption", root).textContent = phase.text;
    query(".cycle-status", root).textContent = currentRound === ROUNDS.length - 1
      ? "最终回复"
      : "循环继续";
  }

  function startCycleAnimation(root) {
    clearPhaseTimer();
    phaseIndex = 0;
    const phases = currentRound === ROUNDS.length - 1 ? FINAL_PHASES : PHASES;
    setCyclePhase(root, phases);

    phaseTimer = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setCyclePhase(root, phases);
    }, 1100);
  }

  function showCycleStart(root) {
    clearPhaseTimer();
    phaseIndex = 0;
    const phases = currentRound === ROUNDS.length - 1 ? FINAL_PHASES : PHASES;
    setCyclePhase(root, phases);
  }

  function stopAutoplay(root) {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    showCycleStart(root);

    const button = query('[data-action="autoplay"]', root);
    button.setAttribute("aria-pressed", "false");
    button.title = "自动播放";
    button.dataset.tooltip = "自动播放";
    button.setAttribute("aria-label", "自动播放");
  }

  function render(root) {
    renderToolbar(root);
    renderHistory(root);

    if (autoplayTimer) {
      startCycleAnimation(root);
    } else {
      showCycleStart(root);
    }
  }

  function setRound(root, nextRound) {
    currentRound = Math.max(0, Math.min(nextRound, ROUNDS.length - 1));
    render(root);
  }

  function mount(root) {
    root.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");

      if (!actionButton) {
        return;
      }

      const action = actionButton.dataset.action;
      if (action === "previous") {
        stopAutoplay(root);
        setRound(root, currentRound - 1);
      } else if (action === "next") {
        stopAutoplay(root);
        setRound(root, (currentRound + 1) % ROUNDS.length);
      } else if (action === "reset") {
        stopAutoplay(root);
        setRound(root, 0);
      } else if (action === "autoplay") {
        if (autoplayTimer) {
          stopAutoplay(root);
          return;
        }

        actionButton.setAttribute("aria-pressed", "true");
        actionButton.title = "暂停";
        actionButton.dataset.tooltip = "暂停";
        actionButton.setAttribute("aria-label", "暂停");
        startCycleAnimation(root);
        autoplayTimer = setInterval(() => {
          if (currentRound === ROUNDS.length - 1) {
            stopAutoplay(root);
            return;
          }
          setRound(root, currentRound + 1);
        }, 3200);
      }
    });

    stopAutoplay(root);
    render(root);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = query("[data-loop-lab]");
    if (root) {
      mount(root);
    }
  });
})();
