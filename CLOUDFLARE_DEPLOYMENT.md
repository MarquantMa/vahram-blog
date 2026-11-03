# 🚀 Cloudflare Pages 部署指南 (vahram.pages.dev)

本博客专为 **Cloudflare Pages** 边缘网络量身打造。项目构建完成后输出为纯静态现代网页（`dist/` 目录），无需后端服务器，秒级全球边缘分发。

---

## 方案一：通过 Cloudflare Pages Git 自动化集成（最推荐，零配置）

每次在 GitHub 上提交 Markdown 文章或修改代码时，Cloudflare Pages 会自动触发重新构建并更新 `https://vahram.pages.dev`。

### 操作步骤（仅需 3 步）：

1. **将本项目推送到您的 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Vahram's Blog"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **在 Cloudflare 仪表盘连接 GitHub 仓库**
   - 打开 [Cloudflare 控制台](https://dash.cloudflare.com/) 并登录。
   - 在左侧菜单点击 **Workers & Pages** -> **Create application** -> 选择 **Pages** 选项卡。
   - 点击 **Connect to Git**（连接到 Git），授权访问您的 GitHub 仓库并选择刚才创建的仓库。

3. **配置构建设置 (Build Settings)**
   - **Project Name (项目名称)**: `vahram`
     > 💡 **重要**：项目名称设为 `vahram` 时，Cloudflare Pages 将为您分配唯一的专属域名 **`vahram.pages.dev`**！
   - **Production branch (生产分支)**: `main`
   - **Framework preset (框架预设)**: `None` (或留空)
   - **Build command (构建命令)**: `npm run build`
   - **Build output directory (构建输出目录)**: `dist`
   - **Environment variables (环境变量，可选)**:
     - 变量名: `NODE_VERSION`，值: `20` 或 `22`

4. **点击「Save and Deploy」（保存并部署）**
   - Cloudflare 会自动运行 `npm run build`，约 15~30 秒后，您的博客即在 **https://vahram.pages.dev** 正式上线！

---

## 方案二：使用 Wrangler 命令行直接部署

如果您已在本地安装并登录了 Cloudflare Wrangler CLI：

```bash
# 1. 执行静态构建
npm run build

# 2. 部署到 Cloudflare Pages 的 vahram 项目
npx wrangler pages deploy dist --project-name=vahram
```

部署完成后终端将直接输出访问链接 `https://vahram.pages.dev`。

---

## 方案三：通过 GitHub Actions 自动化部署

仓库根目录已内置 `.github/workflows/deploy.yml`。若希望通过 GitHub Actions 执行：
1. 在 Cloudflare 控制台「My Profile」->「API Tokens」创建具有 Cloudflare Pages 编辑权限的 Token。
2. 在 GitHub 仓库设置的 **Settings** -> **Secrets and variables** -> **Actions** 中添加：
   - `CLOUDFLARE_API_TOKEN`: 您的 API Token
   - `CLOUDFLARE_ACCOUNT_ID`: 您的 Cloudflare 账户 ID
3. 只要推送代码至 `main` 分支，GitHub Actions 将自动编译并部署到 `vahram.pages.dev`。

---

## 绑定自定义域名（可选）

如果您将来购买了自己的独立域名（例如 `vahram.com` 或 `blog.vahram.dev`）：
1. 在 Cloudflare Pages 项目详情页面，切换到 **Custom domains**（自定义域）选项卡。
2. 点击 **Set up a custom domain**，输入您的域名并按照提示完成 DNS CNAME 解析即可。
