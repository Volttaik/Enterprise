# Enterprise AI WhatsApp Business Assistant

A production-ready, enterprise-grade AI-powered WhatsApp Business Assistant featuring intelligent conversations, CRM, order management, and comprehensive admin dashboard.

## Features

### 🤖 AI & Automation
- **GROQ-Powered AI**: Advanced language model for natural conversations
- **RAG Knowledge Base**: Upload and retrieve business documents
- **Streaming Responses**: Real-time AI responses with streaming support
- **Intent Detection**: Automatic understanding of customer intent
- **Conversation Memory**: Context-aware multi-turn conversations

### 💬 WhatsApp Integration
- **Baileys Library**: Direct WhatsApp Web integration
- **QR Code Pairing**: Secure session management
- **Media Support**: Images, documents, audio, video
- **Message Queue**: Reliable message delivery
- **Auto-Reconnection**: Automatic session recovery

### 👥 CRM & Customer Management
- **Auto-Profile Creation**: Automatic contact profiles from conversations
- **Lead Scoring**: AI-powered lead qualification
- **Conversation History**: Full conversation tracking
- **Customer Tags**: Flexible tagging and segmentation
- **Lifetime Value Tracking**: Customer analytics

### 📦 Order Management
- **Order Creation**: Automated order processing
- **Status Tracking**: Real-time order status updates
- **Payment Tracking**: Integrated payment verification
- **Inventory Management**: Stock level monitoring
- **Low-Stock Alerts**: Automatic inventory notifications

### 💳 Payment Processing
- **Payment Recording**: Multiple payment methods
- **Receipt Verification**: Automated receipt processing
- **Bank Details Management**: Configurable payment information
- **Payment Status Tracking**: Complete payment lifecycle

### 📊 Analytics & Reporting
- **Real-Time Metrics**: Message counts, orders, revenue
- **Trend Analysis**: 7-day and 30-day trends
- **Customer Analytics**: Contact growth and engagement
- **Revenue Reports**: Sales and payment analytics

### 📢 Automation & Campaigns
- **Broadcast Campaigns**: Targeted message campaigns
- **Drip Sequences**: Time-based follow-up sequences
- **Keyword Triggers**: Automated responses
- **Scheduled Messages**: Cron-based scheduling
- **Workflow Automation**: Complex automation rules

### 🎨 Admin Dashboard
- **Dark Theme**: Modern violet-to-teal gradient aesthetic
- **Responsive Design**: Mobile-friendly interface
- **Live Chat Monitor**: Real-time conversation monitoring
- **Module Management**: Dedicated pages for each feature
- **Analytics Dashboard**: Comprehensive metrics visualization

## Tech Stack

### Backend
- **Node.js** + **TypeScript**: Robust server runtime
- **Express**: Web framework
- **tRPC**: End-to-end type-safe APIs
- **Drizzle ORM**: Type-safe database queries
- **MySQL**: Primary database
- **Redis**: Caching and job queue
- **BullMQ**: Background job processing

### Frontend
- **React 19**: Modern UI framework
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: Component library
- **Recharts**: Data visualization
- **Wouter**: Lightweight routing

### AI & Integration
- **GROQ API**: Advanced language models
- **Baileys**: WhatsApp Web integration
- **AWS S3**: File storage

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MySQL 8+
- Redis (optional, for job queue)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/enterprise-ai-whatsapp-assistant.git
   cd enterprise-ai-whatsapp-assistant
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## Configuration

### Environment Variables

**Required:**
- `DATABASE_URL`: MySQL connection string
- `GROQ_API_KEY`: GROQ API key
- `JWT_SECRET`: JWT signing secret

**Optional:**
- `REDIS_URL`: Redis connection (for job queue)
- `AWS_*`: AWS S3 credentials
- `GROQ_MODEL`: GROQ model name (default: mixtral-8x7b-32768)

See `.env.example` for complete list.

## Database Schema

The application uses Drizzle ORM with the following main tables:

- **users**: User accounts and authentication
- **whatsapp_accounts**: WhatsApp business accounts
- **contacts**: CRM contacts
- **conversations**: Conversation threads
- **messages**: Individual messages
- **products**: Product catalog
- **inventory**: Stock levels
- **orders**: Customer orders
- **payments**: Payment records
- **knowledge_base**: Business documents
- **broadcast_campaigns**: Marketing campaigns
- **automation_rules**: Workflow automation
- **analytics_events**: Analytics tracking

## API Documentation

### tRPC Procedures

All API endpoints are type-safe tRPC procedures. Key routers:

- **auth**: Authentication (login, logout, user info)
- **whatsapp**: WhatsApp account management
- **contacts**: CRM contact operations
- **products**: Product catalog management
- **orders**: Order creation and tracking
- **payments**: Payment processing
- **ai**: AI response generation
- **config**: Business configuration
- **analytics**: Analytics and metrics

## Deployment

### Railway Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Connect GitHub repository
   - Configure environment variables
   - Deploy

3. **Add Database**
   - Add MySQL plugin in Railway
   - Add Redis plugin (optional)

4. **Run Migrations**
   ```bash
   pnpm drizzle-kit migrate
   ```

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

### Docker Deployment

```bash
docker build -t whatsapp-ai .
docker run -p 3000:3000 --env-file .env whatsapp-ai
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app
│   └── index.html
├── server/                # Node.js backend
│   ├── services/          # Business logic
│   │   ├── whatsapp.ts   # WhatsApp integration
│   │   └── ai.ts         # AI engine
│   ├── routers.ts        # tRPC routers
│   ├── db.ts             # Database queries
│   └── _core/            # Framework code
├── drizzle/              # Database schema
│   └── schema.ts
├── Dockerfile            # Docker configuration
├── railway.toml          # Railway configuration
└── package.json
```

## Development

### Running Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm check
```

### Code Formatting
```bash
pnpm format
```

### Building for Production
```bash
pnpm build
```

## Features Roadmap

- [ ] Webhook support for WhatsApp
- [ ] Advanced NLP with entity extraction
- [ ] Multi-language support
- [ ] Voice message transcription
- [ ] Image recognition for products
- [ ] Integration with payment gateways
- [ ] Advanced reporting and exports
- [ ] Team collaboration features
- [ ] API rate limiting
- [ ] Custom integrations

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check MySQL is running
- Ensure database exists

### WhatsApp Connection Issues
- Verify phone number format
- Check internet connection
- Ensure session is not already active

### AI Response Issues
- Verify `GROQ_API_KEY` is valid
- Check GROQ API quota
- Review conversation history format

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Email: support@yourbusiness.com

## Acknowledgments

- Baileys for WhatsApp integration
- GROQ for AI capabilities
- Railway for hosting
- shadcn/ui for components

---

**Built with ❤️ for enterprise WhatsApp automation**
