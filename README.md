# GGBond — 个人网站

> 8 岁，工龄 20 年。主业拯救世界，副业准点下班。

- GitHub 仓库：<https://github.com/senyufeng/ggbond-portfolio>
- 线上地址：<https://ggbond-portfolio.uk2023usa2022.workers.dev>

一个用 **纯 HTML / CSS / JavaScript** 做的个人简历网站，主角是《猪猪侠》里的 GGBond（猪猪侠）。整活向，但视觉和工程都是认真的：艺术馆质感的暗色编辑风、毛玻璃图层、颗粒噪点、手绘 SVG 肖像、滚动显现、可投喂的棒棒糖计数器、一个可旋转的实时 3D 打印手办展厅、一组 CS2 主菜单风格的静态战术展示页，以及一份打印出来还算体面的简历。

站点没有任何构建步骤、后端、数据库、Cookie 或第三方统计。推送到 GitHub 后由 **Cloudflare Workers（静态资源模式）** 自动部署，完全跑在免费额度内。Cloudflare 现在推荐新项目使用 Workers + 静态资源，而不是新建 Pages 项目，所以本站最终落在 Workers 上；页面本身仍然是纯静态文件。

![站点预览](assets/preview.jpg)

---

## 为什么是 GitHub + Cloudflare

| 需求 | 方案 |
| --- | --- |
| 代码托管 / 版本管理 | GitHub 公共仓库 |
| 静态托管 / 全球 CDN | Cloudflare Workers 静态资源（免费计划） |
| 自动部署 | Cloudflare Workers Builds 连接 GitHub 仓库，推送到 `main` 即部署 |
| HTTPS / 自定义域名 | Cloudflare 自动签发证书，支持绑定自己的域名 |
| 构建成本 | 0。没有构建命令，Wrangler 直接上传静态文件 |

> 备选方案：Cloudflare Pages 也支持同样的 Git 集成；如果更习惯 Pages 的界面，可按文末的 Pages 备选步骤部署。GitHub Pages + Cloudflare DNS 同样可行，但 Workers 的构建与预览体验更省心。

---

## 本地预览

不需要安装任何依赖。任选一种：

```powershell
# Python 3
python -m http.server 8000

# 或者 Node
npx serve .
```

然后打开 <http://localhost:8000>。

直接双击 `index.html` 也能看到大部分内容，但为了字体、相对路径和 `localStorage` 行为正常，建议用本地服务器。

---

## 3D 档案馆

![3D 档案馆预览](assets/preview-3d.jpg)

打开 <http://localhost:8000/model.html>（线上：<https://ggbond-portfolio.uk2023usa2022.workers.dev/model.html>）。

`model.html` 是一个实时 WebGL 展厅，不是视频，也不是预渲染图片：

- 拖动旋转、滚轮缩放、自动旋转 / 暂停、重置视角
- 四套材质：**3D 打印**（默认）、夜行西装、英雄红、奶油玻璃
- 页面内可下载 **STL**（约 112 mm 高，省略了零厚度的披风曲面；棒棒糖为独立几何体，打印前请在切片软件里检查壁厚和支撑）
- 全部资源自托管，不依赖外部 CDN；Three.js r180 + OrbitControls + RoomEnvironment + STLExporter
- 支持 `prefers-reduced-motion`，默认尊重系统的“减少动态效果”设置

### 为什么没有直接下载网上的 GGBond 模型

搜索到的 GGBond 3D 模型主要是粉丝上传到 itch.io、Sketchfab、爱给网等平台的 3D 打印文件，体积多在 45–200 MB，格式以 STL/FBX/GLB 为主，且授权不清晰、常需登录或积分。直接放进公共站点会有版权、加载体积和可用性问题。

所以这里的模型是一个**原创的程序化 3D 打印风格雕像**：头部、耳朵、身体、西装、披风和棒棒糖都由 Three.js 的几何体现场组合，不包含任何官方模型资产。它更轻（页面无需加载模型文件）、更可控，也更适合这个同人整活项目。

### 关于 3MF / STL / CAD

- **STL**：当前提供的下载格式，只包含几何表面，最适合直接丢进切片软件。
- **3MF**：更适合多材质、多对象和打印参数，但本项目暂时没有导出。
- **CAD / STEP**：适合参数化工业件，不适合这种有机雕塑造型。
- **GLB / GLTF**：适合网页和游戏，可保留材质；如果需要，可以后续加一个 GLB 导出。

网页里的“转动”是 Three.js 每帧更新相机/模型变换后的实时渲染；下载的 STL 是静态几何体，不会自带动画。

---

## CS2 风格战术展示页（纯展示）

![战术大厅预览](assets/preview-tactical.jpg)

三个独立的静态展示页，使用 CS2 主菜单那种极简结构，背景是 Three.js 实时渲染的 Dust II 风格沙漠糖果工厂：

- **大厅**：`lobby.html` — 顶部导航 + 左侧大 PLAY + 底部玩家条
- **加载**：`loading.html` — 静态加载界面，进度固定在 72%
- **简报**：`briefing.html` — 静态行动简报，倒计时固定在 00:15

页面只做展示：PLAY 不跳转、没有匹配队列、加载不会真的连接服务器、简报没有部署按钮。三个页面之间只有顶部导航，不接入主站导航。

场景是原创的 Dust II-inspired 沙漠地图：沙岩墙、拱门、木箱、油桶、A 点标记、棒棒糖招牌；使用 Three.js 程序化几何 + Canvas 纹理。没有使用 Valve / CS2 的任何模型、贴图或 UI 素材。

---

## 目录结构

```text
ggbond-portfolio/
├─ index.html              # 页面内容与结构（文案都在这里改）
├─ styles.css              # 设计系统、布局、响应式、打印样式
├─ script.js               # 导航、滚动显现、计数器、光标光晕、肖像微倾斜
├─ model.html              # 3D 档案馆页面
├─ model.css               # 3D 展厅布局与查看器样式
├─ model.js                # Three.js 程序化模型、材质、交互与 STL 导出
├─ lobby.html              # CS2 风格战术大厅（静态展示）
├─ loading.html            # CS2 风格加载界面（静态展示）
├─ briefing.html           # CS2 风格行动简报（静态展示）
├─ tactical.css            # 三张战术展示页的极简 HUD 样式
├─ tactical.js             # Dust II-inspired 场景与程序化 GGBond 雕像
├─ 404.html                # Cloudflare Workers 自定义 404
├─ favicon.svg             # 站点图标
├─ og.png                  # 社交分享图（1200 × 630）
├─ site.webmanifest        # PWA / 图标信息
├─ robots.txt              # 搜索引擎规则
├─ _headers                # Workers 静态资源安全响应头与缓存策略
├─ wrangler.jsonc          # Workers 配置：名称、静态目录、404 行为
├─ .assetsignore           # 部署时排除 README / 字体授权文件等
├─ assets/
│  ├─ preview.jpg          # 首页预览图
│  ├─ preview-3d.jpg       # 3D 档案馆预览图
│  ├─ preview-tactical.jpg # 战术大厅预览图
│  ├─ fonts/               # 自托管的 Instrument Serif + DM Mono（OFL）
│  └─ vendor/              # Three.js r180 + OrbitControls / RoomEnvironment / STLExporter
└─ README.md
```

---

## 部署到 GitHub + Cloudflare Workers

### 1. 代码在 GitHub

当前仓库已经推送到 <https://github.com/senyufeng/ggbond-portfolio>，并完成了首次提交。若从零复现：

> 首次提交使用的是占位身份 `GGBond <ggbond@users.noreply.github.com>`。如果想换成自己的 GitHub 身份，先执行 `git config user.name "你的名字"`、`git config user.email "你的邮箱"`，再执行 `git commit --amend --reset-author --no-edit`。

```powershell
git remote add origin https://github.com/<你的用户名>/ggbond-portfolio.git
git branch -M main
git push -u origin main
```

如果本机安装了 [GitHub CLI](https://cli.github.com/)，可以一条命令搞定建仓和推送：

```powershell
winget install --id GitHub.cli -e
gh auth login
gh repo create ggbond-portfolio --public --source=. --remote=origin --push
```

### 2. 连接 Cloudflare Workers Builds

当前项目已经连接完成，以下是从零复现时的步骤：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 左侧进入 **Build → Compute → Workers & Pages → Create application**。
3. 选择 **Import a repository / GitHub**，授权后选择 `senyufeng/ggbond-portfolio`。
4. 填写配置：
   - **Worker name**：`ggbond-portfolio`
   - **Production branch**：`main`
   - **Build command**：留空
   - **Deploy command**：`npx wrangler deploy`
   - **Root directory**：留空
5. 点击 **Save and Deploy**。首次部署通常几十秒内完成。
6. 成功后地址形如 `https://ggbond-portfolio.<你的 workers.dev 子域>.workers.dev`。

仓库里的 `wrangler.jsonc` 已经固定了 Worker 名称、静态资源目录和自定义 404；`.assetsignore` 会把 README、字体授权文件等排除在上传列表之外。Cloudflare 的自动配置如果询问是否修改设置，保留现有配置即可。

### 3. 自动部署

Cloudflare Workers Builds 连接仓库后：

- 每次推送到 `main` → 自动构建并发布到生产环境。
- 推送到其他分支或发起 Pull Request → 自动生成预览地址，不影响线上。
- 不需要配置任何 GitHub Secrets 或环境变量。

### 4. 自定义域名（可选）

在 Worker 项目里进入 **Settings → Domains & Routes → Add → Custom domain**：

- 域名已经托管在 Cloudflare：输入域名，DNS 会自动添加。
- 域名不在 Cloudflare：按提示到域名商添加 `CNAME`，指向 `<Worker 名称>.<workers.dev 子域>.workers.dev`。

HTTPS 证书由 Cloudflare 自动签发和续期。

> `index.html` 里的 canonical、`og:url`、`og:image` 已经指向当前 workers.dev 地址。绑定自定义域名后记得一起替换。

### 如果坚持使用 Cloudflare Pages

Cloudflare 的 Pages 入口在部分新账号里会被收在 **“Looking to deploy Pages? Get started”** 链接下。创建时选择 **Pages → Connect to Git**，构建命令填 `exit 0`，输出目录填 `/`。本项目同样适用，但 Workers 和 Pages 选一种即可，不要重复部署。

---

## 想改内容？从这里下手

| 想改什么 | 去哪里 |
| --- | --- |
| 姓名、简介、经历、作品、联系方式 | `index.html`（有清晰的分段注释） |
| 主色、字体、圆角、间距 | `styles.css` 顶部的 `:root` 变量 |
| 投喂棒棒糖的文案 | `script.js` 里的 `ordinaryMessages` 和 `milestoneMessages` |
| 404 页面 | `404.html` |
| 404 路由行为 | `wrangler.jsonc` 里的 `not_found_handling` |
| 3D 模型 / 材质 / 交互 | `model.js` |
| 3D 页面布局 | `model.css`、`model.html` |
| CS2 展示页布局 | `lobby.html`、`loading.html`、`briefing.html` |
| 战术场景 / 相机 / 材质 | `tactical.js` |
| 战术 UI 样式 | `tactical.css` |
| 安全响应头 / 缓存 | `_headers` |
| 部署配置 / 上传排除 | `wrangler.jsonc`、`.assetsignore` |
| 社交分享图 | 替换 `og.png`，并同步更新 `og:image` |
| 预览图 | 替换 `assets/preview.jpg` / `assets/preview-3d.jpg` / `assets/preview-tactical.jpg` |

改完直接 `git add . && git commit -m "update content" && git push`，Cloudflare 会自动发布。

### 换成自己的信息

这个项目默认使用 GGBond 的同人设定。如果你想把它改成真正的个人简历：

1. 把 Hero 的 `GGBond`、`猪猪侠`、简介和 meta 信息换成你的。
2. 把「个人档案」「职业战绩」「精选作品」「核心技能」四段换成你的经历。
3. 把联系区的互动按钮保留、文案改成你的合作方式。
4. 把 `assets/` 里的 SVG 肖像换成你的头像或插画（建议同样用 SVG/WebP，控制体积）。
5. 更新 `index.html` 里的 `<title>`、`description`、Open Graph 和 JSON-LD。

---

## 设计与实现说明

- **字体**：Instrument Serif（标题）与 DM Mono（标签）自托管，避免依赖 Google Fonts；中文回退到系统宋体/黑体。
- **视觉**：暗色暖调底、珊瑚橙 + 奶油白 + 鼠尾草绿，低饱和、重排版；没有霓虹渐变和赛博网格。
- **图层**：毛玻璃卡片、半透明色块、颗粒噪点、光标径向光晕、SVG 印刷网点。
- **动效**：滚动显现、肖像轻微 3D 倾斜、跑马灯、缓慢漂浮的棒棒糖；全部尊重 `prefers-reduced-motion`。
- **交互**：投喂计数器写入 `localStorage`，刷新后保留；点击时飘出棒棒糖并显示随机文案。
- **无障碍**：语义化结构、跳过导航链接、键盘焦点样式、`aria` 标签、状态提示 `aria-live`。
- **打印**：点击「打印这份简历」会隐藏装饰和交互，输出一份白底、紧凑的简历版式。
- **3D**：`model.html` 用 Three.js 实时渲染，模型由几何体程序化生成，不加载外部 GLB/STL；支持拖动、缩放、自动旋转、四套物理材质和 STL 导出。
- **战术展示页**：`tactical.js` 用另一套 Three.js 场景搭建 Dust II-inspired 沙漠糖果工厂（沙岩墙、拱门、木箱、油桶、A 点、棒棒糖招牌），三张页面共享场景，仅切换相机预设和 HUD。
- **性能**：首页无框架、无外部请求，字体合计约 70 KB；3D 页和战术页按需加载自托管的 Three.js（约 720 KB），没有模型下载和外部 CDN。

---

## 免责声明

这是一个**非官方、非商业的同人整活项目**。“猪猪侠 / GG Bond”角色及相关作品版权归广东咏声动漫股份有限公司等权利人所有。本站不使用官方图片、视频或音频；页面中的小猪肖像为原创 SVG 插画，3D 模型为原创程序化几何体，仅用于个人学习与娱乐。如有侵权，请联系删除。

## License

- 代码（HTML/CSS/JS）与原创插画、3D 模型：MIT，见 [LICENSE](LICENSE)。
- 字体：SIL Open Font License 1.1，见 `assets/fonts/OFL-*.txt`。
- Three.js：MIT，见 `assets/vendor/three-LICENSE.txt`。
