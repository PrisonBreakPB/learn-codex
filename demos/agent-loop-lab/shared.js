(function () {
  const SCENARIO = {
    title: "Agent Loop Lab",
    subtitle: "预设场景：用户询问当前项目有哪些文件",
    note: "这是教学回放，不调用真实模型或工具；事件顺序与源码证据来自固定的 Codex 版本研究基线。",
    inspirations: {
      roadmap: "借鉴 roadmap.sh 的节点路径与学习地图感",
      canvas: "借鉴 Dify、n8n、Langflow 的工作流画布与节点调试",
      stage: "借鉴 tldraw 的空间对象感，把消息做成会移动的对象",
      timeline: "借鉴工作流可观测界面的精确追踪，把每次追加都做成事件"
    },
    steps: [
      {
        id: "user",
        short: "用户输入",
        title: "用户消息进入系统",
        summary: "TUI 接收用户问题，准备把它作为新的 turn 输入提交。",
        lane: "user",
        activeNode: "user",
        activeEdge: "user->tui",
        token: { x: 108, y: 136 },
        runningCard: { lane: "user", tone: "assistant", title: "用户消息", text: "“当前项目有哪些文件？”" },
        delta: [
          "对话历史新增一条 user message",
          "客户端判断当前没有活动 regular turn"
        ],
        evidence: [
          {
            label: "TUI 输入分流",
            path: "codex-rs/tui/src/app/thread_routing.rs",
            symbol: "AppCommand::UserTurn"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" }
        ],
        context: "当前可见消息只有 system 与 user，因此下一步的模型准备会围绕这次用户请求展开。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "本步新增" }
        ]
      },
      {
        id: "turn-start",
        short: "turn/start",
        title: "turn/start 进入 App Server",
        summary: "TUI 把输入包装成 turn/start 请求，App Server 生成用户输入操作并提交给核心会话。",
        lane: "runtime",
        activeNode: "tui",
        activeEdge: "tui->server",
        token: { x: 274, y: 134 },
        runningCard: { lane: "model", tone: "assistant", title: "turn/start", text: "创建提交 id，并把输入转成 Op::UserInput。" },
        delta: [
          "消息内容还没变，但 turn 生命周期已开始",
          "提交队列为后续 RegularTask 做准备"
        ],
        evidence: [
          {
            label: "TUI 发起请求",
            path: "codex-rs/tui/src/app_server_session.rs",
            symbol: "AppServerSession::turn_start"
          },
          {
            label: "App Server 处理 turn/start",
            path: "codex-rs/app-server/src/request_processors/turn_processor.rs",
            symbol: "turn_start_inner"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" }
        ],
        context: "此时还没有 assistant 输出；变化主要发生在协议边界与核心提交队列。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "已有历史" }
        ]
      },
      {
        id: "tool-call",
        short: "工具决策",
        title: "模型决定调用工具",
        summary: "核心启动 regular turn。第一次请求模型生成后，模型没有直接回答，而是输出一个 shell 工具调用。",
        lane: "runtime",
        activeNode: "model",
        activeEdge: "session->model",
        token: { x: 690, y: 138 },
        runningCard: { lane: "model", tone: "assistant", title: "assistant tool_call", text: "shell_command(\"Get-ChildItem\")" },
        delta: [
          "历史新增 assistant tool_call",
          "ToolCallRuntime future 被创建并排入执行"
        ],
        evidence: [
          {
            label: "启动或注入任务",
            path: "codex-rs/core/src/session/handlers.rs",
            symbol: "user_input_or_turn_inner"
          },
          {
            label: "模型生成与工具路由",
            path: "codex-rs/core/src/session/turn.rs",
            symbol: "run_sampling_request"
          },
          {
            label: "工具运行时",
            path: "codex-rs/core/src/tools/parallel.rs",
            symbol: "ToolCallRuntime"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")" }
        ],
        context: "这一刻最重要的不是最终回复，而是 assistant 已把“该用什么工具”写进历史。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "已有历史" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")", origin: "本步新增" }
        ]
      },
      {
        id: "tool-running",
        short: "工具运行",
        title: "工具真正执行",
        summary: "Shell 工具开始运行，UI 可以看到当前 turn 正在等待工具返回。",
        lane: "tool",
        activeNode: "tool",
        activeEdge: "model->tool",
        token: { x: 892, y: 138 },
        runningCard: { lane: "tool", tone: "tool", title: "shell_command", text: "Get-ChildItem 正在执行..." },
        delta: [
          "消息历史暂时不变",
          "状态变化是工具进入 in-flight 队列"
        ],
        evidence: [
          {
            label: "工具并行等待",
            path: "codex-rs/core/src/tools/parallel.rs",
            symbol: "ToolCallRuntime::handle_tool_call_with_source"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")" }
        ],
        context: "这一步强调“状态在变，但消息历史暂未追加”。这正是动画里值得表现的等待瞬间。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "已有历史" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")", origin: "已有历史" }
        ]
      },
      {
        id: "tool-result",
        short: "结果写回",
        title: "工具结果被写回历史",
        summary: "命令结果返回后，核心把它记为 tool output，真正进入下一次模型可见的历史上下文。",
        lane: "tool",
        activeNode: "history",
        activeEdge: "tool->history",
        token: { x: 642, y: 432 },
        runningCard: { lane: "tool", tone: "tool", title: "tool result", text: "README.md / docs / .gitignore" },
        delta: [
          "历史新增 tool result",
          "模型下一次生成请求将看到这份结果"
        ],
        evidence: [
          {
            label: "工具输出解析与写回",
            path: "codex-rs/core/src/stream_events_utils.rs",
            symbol: "handle_output_item_done"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")" },
          { role: "tool", text: "README.md, docs, .gitignore" }
        ],
        context: "这里是你强调“history 动态追加”的最佳位置，因为工具结果第一次成为未来模型生成请求的正式输入。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "已有历史" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")", origin: "已有历史" },
          { role: "tool", text: "README.md, docs, .gitignore", origin: "本步新增" }
        ]
      },
      {
        id: "follow_up_generation",
        short: "再次请求模型生成",
        title: "当前 turn 再次请求模型生成",
        summary: "不是开启新的 turn，而是在同一个 run_turn 内，用更新后的历史重新组装提示词并再次请求模型生成。",
        lane: "runtime",
        activeNode: "session",
        activeEdge: "history->session",
        token: { x: 440, y: 438 },
        runningCard: { lane: "model", tone: "assistant", title: "context pack", text: "system + user + tool_call + tool_result 一起回到模型。" },
        delta: [
          "没有新增消息，但“模型看到的上下文”已经变了",
          "这一步正适合用动态累积和回流动画"
        ],
        evidence: [
          {
            label: "turn 循环继续",
            path: "codex-rs/core/src/session/turn.rs",
            symbol: "run_turn"
          },
          {
            label: "下一次模型生成仍在当前 turn 内",
            path: "codex-rs/core/src/session/turn.rs",
            symbol: "run_sampling_request"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")" },
          { role: "tool", text: "README.md, docs, .gitignore" }
        ],
        context: "如果想把“历史如何喂回模型”做成第一视觉，这一步应该是主镜头。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "已有历史" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")", origin: "已有历史" },
          { role: "tool", text: "README.md, docs, .gitignore", origin: "已有历史" }
        ]
      },
      {
        id: "answer",
        short: "最终回答",
        title: "最终回答与事件回传",
        summary: "模型基于更新后的历史给出最终回答，事件通过 App Server 翻译并回到 TUI。",
        lane: "runtime",
        activeNode: "reply",
        activeEdge: "session->reply",
        token: { x: 144, y: 438 },
        runningCard: { lane: "user", tone: "assistant", title: "assistant reply", text: "当前项目包含 README.md、docs 和 .gitignore。" },
        delta: [
          "历史新增 assistant final message",
          "客户端收到 turn item 与完成事件"
        ],
        evidence: [
          {
            label: "App Server 消费核心事件",
            path: "codex-rs/app-server/src/request_processors/thread_lifecycle.rs",
            symbol: "conversation.next_event()"
          },
          {
            label: "事件翻译",
            path: "codex-rs/app-server/src/bespoke_event_handling.rs",
            symbol: "EventMsg::TurnStarted"
          }
        ],
        history: [
          { role: "system", text: "你是交互式 Codex 助手。" },
          { role: "user", text: "当前项目有哪些文件？" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")" },
          { role: "tool", text: "README.md, docs, .gitignore" },
          { role: "assistant", text: "当前项目包含 README.md、docs 和 .gitignore。" }
        ],
        context: "至此，用户看到的是最终自然语言答案；但学习者也能回头检查它是怎样由前面的 history 累积得来的。",
        ledger: [
          { role: "system", text: "你是交互式 Codex 助手。", origin: "已有历史" },
          { role: "user", text: "当前项目有哪些文件？", origin: "已有历史" },
          { role: "assistant", text: "tool_call: shell_command(\"Get-ChildItem\")", origin: "已有历史" },
          { role: "tool", text: "README.md, docs, .gitignore", origin: "已有历史" },
          { role: "assistant", text: "当前项目包含 README.md、docs 和 .gitignore。", origin: "本步新增" }
        ]
      }
    ]
  };

  const NODE_POSITIONS = {
    user: { x: 20, y: 78 },
    tui: { x: 186, y: 76 },
    server: { x: 352, y: 76 },
    session: { x: 352, y: 376 },
    model: { x: 602, y: 76 },
    tool: { x: 812, y: 76 },
    history: { x: 560, y: 376 },
    reply: { x: 62, y: 376 }
  };

  const CANVAS_NODES = [
    { id: "user", title: "用户输入", copy: "预设问题进入 TUI", badge: "Input" },
    { id: "tui", title: "TUI", copy: "判断是 turn/start 还是 steer", badge: "Client" },
    { id: "server", title: "App Server", copy: "JSON-RPC 边界与请求翻译", badge: "Bridge" },
    { id: "model", title: "Model + Tool 决策", copy: "模型生成、工具调用、回复", badge: "Reason" },
    { id: "tool", title: "Shell Tool", copy: "执行命令并返回结果", badge: "Action" },
    { id: "history", title: "History", copy: "tool result 进入可见上下文", badge: "State" },
    { id: "session", title: "Core Session", copy: "run_turn / run_sampling_request", badge: "Runtime" },
    { id: "reply", title: "最终回答", copy: "事件回传后更新界面", badge: "Output" }
  ];

  const CANVAS_EDGES = [
    { id: "user->tui", from: "user", to: "tui" },
    { id: "tui->server", from: "tui", to: "server" },
    { id: "server->session", from: "server", to: "session" },
    { id: "session->model", from: "session", to: "model" },
    { id: "model->tool", from: "model", to: "tool" },
    { id: "tool->history", from: "tool", to: "history" },
    { id: "history->session", from: "history", to: "session" },
    { id: "session->reply", from: "session", to: "reply" }
  ];

  function q(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function createShell(kind) {
    const wrapper = document.createElement("div");
    wrapper.className = "demo-shell";
    wrapper.innerHTML = `
      <section class="demo-header">
        <div class="demo-topbar">
          <div class="demo-title-group">
            <p class="eyebrow">Agent Loop Lab</p>
            <div class="demo-title-row">
              <h1>${SCENARIO.title}</h1>
              <span class="step-tag">${kind.toUpperCase()}</span>
            </div>
            <p class="demo-copy">${SCENARIO.subtitle}</p>
          </div>
          <div class="demo-controls">
            <button class="control-btn" data-action="prev">上一步</button>
            <button class="control-btn" data-action="next" data-variant="accent">下一步</button>
            <button class="control-btn" data-action="auto" data-variant="soft">自动播放</button>
            <button class="control-btn" data-action="reset">重置</button>
            <a class="ghost-link" href="./index.html">返回总览</a>
          </div>
        </div>
        <div class="step-pager">
          <span>同一段数据回放，比较不同前端表达</span>
          <div class="step-dots"></div>
        </div>
      </section>
      <div class="${kind === "stage" ? "stage-grid" : "shell-grid"}">
        <section class="${kind === "stage" ? "" : "surface "}demo-surface"></section>
        <aside class="side-panel">
          <section>
            <div class="section-head">
              <h2>当前步骤</h2>
              <span class="trace-kind">Step</span>
            </div>
            <div class="current-step-box"></div>
          </section>
          <section>
            <div class="section-head">
              <h2>这一步新增了什么</h2>
            </div>
            <div class="delta-list"></div>
          </section>
          <section>
            <div class="section-head">
              <h2>源码证据</h2>
            </div>
            <div class="evidence-list"></div>
          </section>
          <section>
            <div class="section-head">
              <h2>设计借鉴</h2>
            </div>
            <div class="legend-list">
              <div class="legend-item">
                <strong>${SCENARIO.inspirations[kind]}</strong>
                <span class="small muted">${SCENARIO.note}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    `;
    return wrapper;
  }

  function renderCommonSide(root, step, index) {
    q(".current-step-box", root).innerHTML = `
      <div class="context-card">
        <h3>Step ${index + 1} / ${SCENARIO.steps.length}</h3>
        <p><strong>${step.title}</strong></p>
        <p>${step.summary}</p>
        <p class="small muted" style="margin-top:8px">${step.context}</p>
      </div>
    `;

    q(".delta-list", root).innerHTML = step.delta
      .map((item) => `<div class="delta-item"><strong>变化</strong><span class="small muted">${item}</span></div>`)
      .join("");

    q(".evidence-list", root).innerHTML = step.evidence
      .map((item) => `
        <div class="evidence-item">
          <strong>${item.label}</strong>
          <span class="small muted">${item.path}</span>
          <code>${item.symbol}</code>
        </div>
      `)
      .join("");
  }

  function renderDots(root, current) {
    q(".step-dots", root).innerHTML = SCENARIO.steps
      .map((step, index) => `<button class="step-dot ${index === current ? "is-active" : ""}" data-step="${index}" title="${step.short}"></button>`)
      .join("");
  }

  function roadMapSurface(step, current) {
    const nodes = SCENARIO.steps.map((item, index) => {
      const status = index < current ? "is-complete" : index === current ? "is-active" : "";
      return `
        <div class="roadmap-step ${status}">
          <button type="button" data-step="${index}">
            <div class="step-title">${item.short}</div>
            <div class="step-copy">${item.title}</div>
          </button>
        </div>
      `;
    }).join("");

    return `
      <div class="section-head">
        <h2>Demo A / 路线图模式</h2>
        <span class="node-badge">学习路径</span>
      </div>
      <div class="roadmap-track">${nodes}</div>
      <div class="canvas-footer">
        <div class="context-card">
          <h3>${step.title}</h3>
          <p>${step.summary}</p>
        </div>
        <div class="memory-panel surface">
          <div class="section-head">
            <h3>历史消息累积</h3>
            <span class="small muted">${step.history.length} 条</span>
          </div>
          <div class="history-ribbon">
            ${step.history.map(renderChip).join("")}
          </div>
        </div>
        <div class="context-card">
          <h3>当前模型可见上下文</h3>
          <p>${step.context}</p>
        </div>
      </div>
    `;
  }

  function renderChip(message) {
    return `
      <span class="msg-chip" data-role="${message.role}">
        <span class="chip-role">${message.role}</span>
        <span class="chip-text">${escapeHtml(message.text)}</span>
      </span>
    `;
  }

  function edgeStyle(edge) {
    const from = NODE_POSITIONS[edge.from];
    const to = NODE_POSITIONS[edge.to];
    const x1 = from.x + 180;
    const y1 = from.y + 42;
    const x2 = to.x;
    const y2 = to.y + 42;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return `left:${x1}px;top:${y1}px;width:${length}px;transform:rotate(${angle}deg);`;
  }

  function canvasSurface(step) {
    return `
      <div class="section-head">
        <h2>Demo B / 工作流画布模式</h2>
        <span class="node-badge">系统结构</span>
      </div>
      <div class="canvas-board">
        ${CANVAS_EDGES.map((edge) => `<div class="canvas-edge ${edge.id === step.activeEdge ? "is-active" : ""}" style="${edgeStyle(edge)}"></div>`).join("")}
        ${CANVAS_NODES.map((node) => {
          const pos = NODE_POSITIONS[node.id];
          return `
            <div class="canvas-node ${node.id === step.activeNode ? "is-active" : ""}" style="left:${pos.x}px;top:${pos.y}px">
              <span class="node-badge">${node.badge}</span>
              <h3>${node.title}</h3>
              <p>${node.copy}</p>
            </div>
          `;
        }).join("")}
        <div class="canvas-token" style="left:${step.token.x}px;top:${step.token.y}px"></div>
      </div>
      <div class="canvas-footer">
        <div class="canvas-statusbar">
          ${step.delta.map((item) => `<span class="status-pill">${item}</span>`).join("")}
        </div>
        <div class="memory-panel surface">
          <div class="section-head">
            <h3>History</h3>
            <span class="small muted">${step.history.length} entries</span>
          </div>
          <div class="history-ribbon">
            ${step.history.map(renderChip).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function stageSurface(step) {
    const laneMap = {
      user: [],
      model: [],
      tool: []
    };
    if (step.runningCard) {
      laneMap[step.runningCard.lane].push(step.runningCard);
    }

    return `
      <div class="stage-board">
        <div class="section-head" style="margin-bottom:0">
          <h2 style="color:#f7fafc">Demo C / 动态舞台模式</h2>
          <span class="node-badge">视觉冲击</span>
        </div>
        <div class="stage-memory">
          ${step.history.map(renderChip).join("")}
        </div>
        <div class="stage-lanes">
          <section class="lane">
            <h3>用户 / 客户端</h3>
            ${laneMap.user.map(renderFloatingCard).join("")}
          </section>
          <section class="lane">
            <h3>模型 / 运行时</h3>
            ${laneMap.model.map(renderFloatingCard).join("")}
          </section>
          <section class="lane">
            <h3>工具 / 结果</h3>
            ${laneMap.tool.map(renderFloatingCard).join("")}
          </section>
        </div>
        <div class="stage-reflow">
          <div class="reflow-ghosts">
            ${step.history.map((message) => `<span class="ghost-chip">${message.role}</span>`).join("")}
          </div>
          <div class="context-core">本次模型生成请求可见上下文<br><strong>${step.history.length}</strong> 条消息</div>
          <div class="reflow-ghosts" style="justify-content:flex-end">
            <span class="ghost-chip">${step.short}</span>
            <span class="ghost-chip">${step.activeNode}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderFloatingCard(card) {
    return `
      <article class="floating-card" data-tone="${card.tone}">
        <h4>${card.title}</h4>
        <p>${card.text}</p>
      </article>
    `;
  }

  function timelineSurface(step, current) {
    const laneRows = [
      {
        title: "用户 / 客户端",
        copy: "输入与最终反馈",
        lane: "user"
      },
      {
        title: "Runtime / Session",
        copy: "turn、模型生成与上下文回流",
        lane: "runtime"
      },
      {
        title: "Tools",
        copy: "调用、等待与结果写回",
        lane: "tool"
      }
    ];

    return `
      <div class="section-head">
        <h2>Demo D / 时序追踪模式</h2>
        <span class="node-badge">复核友好</span>
      </div>
      <div class="timeline-board">
        <div class="timeline-head">
          <div class="head-cell">Lane / Step</div>
          ${SCENARIO.steps.map((item, index) => `<div class="head-cell">${index + 1}<br>${item.short}</div>`).join("")}
        </div>
        ${laneRows.map((lane) => `
          <div class="lane-row">
            <div class="lane-label">
              <strong>${lane.title}</strong>
              <span>${lane.copy}</span>
            </div>
            ${SCENARIO.steps.map((item, index) => {
              if (item.lane !== lane.lane) {
                return `<div class="lane-cell ${index === current ? "is-active" : ""}"></div>`;
              }
              return `
                <div class="lane-cell ${index === current ? "is-active" : ""}">
                  <div class="trace-node">
                    <strong>${item.title}</strong>
                    <span>${item.summary}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `).join("")}
        <div class="history-ledger">
          <div class="section-head">
            <h3>动态追加的 History Ledger</h3>
            <span class="small muted">${step.ledger.length} entries</span>
          </div>
          <div class="ledger-list">
            ${step.ledger.map((item) => `
              <div class="ledger-item">
                <strong>${item.role}</strong>
                <span>${escapeHtml(item.text)}</span>
                <code>${item.origin}</code>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderSurface(root, kind, step, current) {
    const surface = q(".demo-surface", root);
    if (kind === "roadmap") {
      surface.innerHTML = roadMapSurface(step, current);
    } else if (kind === "canvas") {
      surface.innerHTML = canvasSurface(step);
    } else if (kind === "stage") {
      surface.innerHTML = stageSurface(step);
    } else {
      surface.innerHTML = timelineSurface(step, current);
    }
  }

  function mountDemo(container, kind) {
    let current = 0;
    let timer = null;
    const root = createShell(kind);
    container.appendChild(root);

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      q('[data-action="auto"]', root).textContent = "自动播放";
    }

    function update() {
      const step = SCENARIO.steps[current];
      renderDots(root, current);
      renderCommonSide(root, step, current);
      renderSurface(root, kind, step, current);
      q('[data-action="prev"]', root).disabled = current === 0;
      q('[data-action="next"]', root).disabled = current === SCENARIO.steps.length - 1;
    }

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button, [data-step]");
      if (!button) {
        return;
      }

      if (button.matches(".step-dot") || button.closest(".roadmap-step")) {
        const stepIndex = Number(button.getAttribute("data-step") || button.closest("[data-step]").getAttribute("data-step"));
        current = stepIndex;
        stopAuto();
        update();
        return;
      }

      const action = button.getAttribute("data-action");
      if (action === "prev" && current > 0) {
        current -= 1;
        update();
      } else if (action === "next" && current < SCENARIO.steps.length - 1) {
        current += 1;
        update();
      } else if (action === "reset") {
        current = 0;
        stopAuto();
        update();
      } else if (action === "auto") {
        if (timer) {
          stopAuto();
        } else {
          q('[data-action="auto"]', root).textContent = "暂停";
          timer = setInterval(() => {
            if (current >= SCENARIO.steps.length - 1) {
              stopAuto();
              return;
            }
            current += 1;
            update();
          }, 1500);
        }
      }
    });

    update();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const mount = q("[data-agent-loop-demo]");
    if (!mount) {
      return;
    }
    mountDemo(mount, mount.getAttribute("data-agent-loop-demo"));
  });
})();
