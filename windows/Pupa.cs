// Pupa — ekrano augintinis Windows kompiuteriui.
// Sukompiliuojamas su Windows integruotu .NET Framework 4 kompiliatoriumi (žr. Paleisti.bat),
// todėl rašoma C# 5 sintakse (be $"", ?. ir pan.).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Pupa
{
    static class Program
    {
        [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

        [STAThread]
        static void Main()
        {
            bool created;
            using (Mutex m = new Mutex(true, "Pupa.Augintinis.VienasEgzempliorius", out created))
            {
                if (!created) return;
                try { SetProcessDPIAware(); } catch { }
                Application.EnableVisualStyles();
                Application.Run(new PetForm());
            }
        }
    }

    class Heart
    {
        public float X, Y, Vx;
        public double Born;
    }

    class PetForm : Form
    {
        // ---------- Win32 ----------
        [StructLayout(LayoutKind.Sequential)] struct POINT { public int x, y; public POINT(int x, int y) { this.x = x; this.y = y; } }
        [StructLayout(LayoutKind.Sequential)] struct SIZE { public int cx, cy; public SIZE(int cx, int cy) { this.cx = cx; this.cy = cy; } }
        [StructLayout(LayoutKind.Sequential, Pack = 1)] struct BLENDFUNCTION { public byte BlendOp, BlendFlags, SourceConstantAlpha, AlphaFormat; }
        [StructLayout(LayoutKind.Sequential)] struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }

        [DllImport("user32.dll")] static extern bool UpdateLayeredWindow(IntPtr hwnd, IntPtr hdcDst, ref POINT pptDst, ref SIZE psize, IntPtr hdcSrc, ref POINT pprSrc, int crKey, ref BLENDFUNCTION pblend, int dwFlags);
        [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr hWnd);
        [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
        [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr hDC);
        [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr hdc);
        [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr hDC, IntPtr hObject);
        [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr hObject);
        [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
        [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
        [DllImport("user32.dll")] static extern bool DestroyIcon(IntPtr handle);

        // ---------- Frazės ----------
        static readonly string[] Hello = { "Labas! Aš Pupa.", "Sveikas sugrįžęs!", "Aš čia, jei ko reikės." };
        static readonly string[] Poke = { "Hehe, kutena!", "Oi!", "Dar kartą!", "Myliu tave!", "Bum!", "Ei, atsargiau!" };
        static readonly string[] Typing = { "Ką rašai?", "Rašyk, rašyk, aš saugau.", "Kaip greitai spausdini!" };
        static readonly string[] Idle = { "Gal arbatos?", "Nepamiršk tepalų keitimo!", "Ar padangos pripūstos?", "Atsistok, pasirąžyk!", "Atsigerk vandens.", "Aš tiesiog pabūsiu čia.", "Gal laikas pertraukėlei?" };
        static readonly string[] Wake = { "A? Aš nemiegojau!", "Mmm... labas.", "Jau grįžai?" };
        static readonly string[] Drag = { "Wiii!", "Kur mane neši?", "Skrendu!" };

        // ---------- Matmenys (bazinėmis 96 DPI vienetais) ----------
        const float W = 260f, H = 250f, S = 1.1f;
        static readonly float PetX = (W - 110f * S) / 2f;
        static readonly float PetY = H - 120f * S - 2f;

        readonly float k;                 // DPI mastelis
        readonly Bitmap canvas;
        readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
        readonly Stopwatch clock = Stopwatch.StartNew();
        readonly Random rnd = new Random();
        readonly NotifyIcon tray = new NotifyIcon();
        readonly ContextMenuStrip menu = new ContextMenuStrip();
        readonly List<Heart> hearts = new List<Heart>();
        readonly Font bubbleFont = new Font("Segoe UI", 10f, FontStyle.Regular, GraphicsUnit.Point);
        readonly Font zFont = new Font("Segoe UI", 11f, FontStyle.Bold, GraphicsUnit.Point);
        ToolStripMenuItem walkItem, startupItem;

        double now, lastT, nextBlink = 2, blinkUntil, jumpStart = -10, happyUntil, typingUntil, bubbleStart, bubbleUntil, nextChat, nextWander, lastTopmost;
        string bubbleText;
        bool asleep, walking, walkEnabled = true, wasTyping;
        float walkTarget;
        int face = 1;
        Point lastCursor;
        bool mouseDown, dragged;
        Point downCursor, downLoc;

        const string RegKey = @"Software\Pupa";
        const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";

        public PetForm()
        {
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.Manual;
            TopMost = true;
            Text = "Pupa";

            using (Graphics g = CreateGraphics()) k = g.DpiX / 96f;
            canvas = new Bitmap((int)Math.Ceiling(W * k), (int)Math.Ceiling(H * k), System.Drawing.Imaging.PixelFormat.Format32bppArgb);
            Size = canvas.Size;

            LoadSettings();
            BuildMenu();

            tray.Text = "Pupa";
            tray.Icon = MakeIcon();
            tray.ContextMenuStrip = menu;
            tray.Visible = true;
            tray.MouseClick += delegate (object s, MouseEventArgs e) { if (e.Button == MouseButtons.Left) DoPoke(new PointF(W / 2, PetY + 60)); };
            ContextMenuStrip = menu;

            nextChat = 120 + rnd.NextDouble() * 120;
            nextWander = 25 + rnd.NextDouble() * 30;
            int h = DateTime.Now.Hour;
            if (h >= 5 && h < 11) Say("Labas rytas!");
            else if (h >= 18 && h < 23) Say("Labas vakaras!");
            else if (h >= 23 || h < 5) Say("Gal jau laikas miegoti?");
            else Say(Pick(Hello));

            timer.Interval = 33;
            timer.Tick += delegate { Tick(); };
            timer.Start();
        }

        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= 0x80000 | 0x80 | 0x8; // WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST
                return cp;
            }
        }

        string Pick(string[] list) { return list[rnd.Next(list.Length)]; }

        void Say(string text)
        {
            bubbleText = text;
            bubbleStart = now;
            bubbleUntil = now + 2.2 + text.Length * 0.06;
        }

        // ---------- Nustatymai ----------
        void LoadSettings()
        {
            Rectangle wa = Screen.PrimaryScreen.WorkingArea;
            Point p = new Point(wa.Right - Width, wa.Bottom - Height);
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RegKey))
                {
                    if (key != null)
                    {
                        object x = key.GetValue("X"), y = key.GetValue("Y"), walk = key.GetValue("Walk");
                        if (x is int && y is int)
                        {
                            Point saved = new Point((int)x, (int)y);
                            foreach (Screen sc in Screen.AllScreens)
                                if (sc.WorkingArea.Contains(new Point(saved.X + Width / 2, saved.Y + Height / 2))) p = saved;
                        }
                        if (walk is int) walkEnabled = (int)walk != 0;
                    }
                }
            }
            catch { }
            Location = p;
        }

        void SaveSettings()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RegKey))
                {
                    key.SetValue("X", Left, RegistryValueKind.DWord);
                    key.SetValue("Y", Top, RegistryValueKind.DWord);
                    key.SetValue("Walk", walkEnabled ? 1 : 0, RegistryValueKind.DWord);
                }
            }
            catch { }
        }

        bool StartupEnabled()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKey))
                    return key != null && key.GetValue("Pupa") != null;
            }
            catch { return false; }
        }

        void SetStartup(bool on)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RunKey))
                {
                    if (on) key.SetValue("Pupa", "\"" + Application.ExecutablePath + "\"");
                    else key.DeleteValue("Pupa", false);
                }
            }
            catch { }
        }

        void BuildMenu()
        {
            menu.Items.Add("Pasakyk ką nors", null, delegate { Wakeup(false); Say(Pick(Idle)); });
            walkItem = new ToolStripMenuItem("Vaikščioti po ekraną");
            walkItem.Checked = walkEnabled;
            walkItem.Click += delegate { walkEnabled = !walkEnabled; walkItem.Checked = walkEnabled; if (!walkEnabled) walking = false; SaveSettings(); };
            menu.Items.Add(walkItem);
            startupItem = new ToolStripMenuItem("Paleisti kartu su Windows");
            startupItem.Click += delegate { bool on = !StartupEnabled(); SetStartup(on); startupItem.Checked = StartupEnabled(); if (on) Say("Būsiu čia kiekvieną kartą!"); };
            menu.Opening += delegate { startupItem.Checked = StartupEnabled(); };
            menu.Items.Add(startupItem);
            menu.Items.Add("Grįžti į kampą", null, delegate
            {
                Rectangle wa = Screen.FromControl(this).WorkingArea;
                walking = false;
                Location = new Point(wa.Right - Width, wa.Bottom - Height);
                SaveSettings();
            });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Uždaryti Pupą", null, delegate { Close(); });
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            timer.Stop();
            SaveSettings();
            tray.Visible = false;
            tray.Dispose();
            base.OnFormClosed(e);
        }

        // ---------- Pelė ----------
        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            if (e.Button != MouseButtons.Left) return;
            mouseDown = true; dragged = false;
            downCursor = Cursor.Position; downLoc = Location;
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            if (!mouseDown) return;
            Point c = Cursor.Position;
            int dx = c.X - downCursor.X, dy = c.Y - downCursor.Y;
            if (!dragged && dx * dx + dy * dy < 25) return;
            if (!dragged) { dragged = true; walking = false; Wakeup(false); Say(Pick(Drag)); }
            Location = new Point(downLoc.X + dx, downLoc.Y + dy);
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            base.OnMouseUp(e);
            if (e.Button != MouseButtons.Left || !mouseDown) return;
            mouseDown = false;
            if (dragged) { ClampToScreen(); SaveSettings(); nextWander = now + 40 + rnd.NextDouble() * 40; }
            else DoPoke(new PointF(e.X / k, e.Y / k));
        }

        void ClampToScreen()
        {
            Rectangle wa = Screen.FromPoint(new Point(Left + Width / 2, Top + Height / 2)).WorkingArea;
            int x = Math.Max(wa.Left, Math.Min(wa.Right - Width, Left));
            int y = Math.Max(wa.Top, Math.Min(wa.Bottom - Height, Top));
            Location = new Point(x, y);
        }

        void DoPoke(PointF at)
        {
            Wakeup(false);
            walking = false;
            jumpStart = now;
            happyUntil = now + 1.5;
            Say(Pick(Poke));
            for (int i = 0; i < 5; i++)
            {
                Heart h = new Heart();
                h.X = at.X; h.Y = at.Y - 10;
                h.Vx = (float)(rnd.NextDouble() * 60 - 30);
                h.Born = now + i * 0.08;
                hearts.Add(h);
            }
        }

        void Wakeup(bool speak)
        {
            if (!asleep) return;
            asleep = false;
            if (speak) Say(Pick(Wake));
        }

        static uint IdleMs()
        {
            LASTINPUTINFO li = new LASTINPUTINFO();
            li.cbSize = (uint)Marshal.SizeOf(typeof(LASTINPUTINFO));
            if (!GetLastInputInfo(ref li)) return 0;
            return unchecked((uint)Environment.TickCount - li.dwTime);
        }

        // ---------- Pagrindinis ciklas ----------
        void Tick()
        {
            now = clock.Elapsed.TotalSeconds;
            double dt = Math.Min(0.1, now - lastT);
            lastT = now;

            Point c = Cursor.Position;
            bool cursorMoved = c != lastCursor;
            lastCursor = c;
            uint idle = IdleMs();

            // Rašymas: įvestis vyksta, bet pelė nejuda
            if (idle < 250 && !cursorMoved && !mouseDown)
            {
                if (!wasTyping && bubbleText == null && rnd.NextDouble() < 0.12) Say(Pick(Typing));
                typingUntil = now + 1.2;
            }
            wasTyping = now < typingUntil;

            if (!asleep && idle > 60000) { asleep = true; walking = false; bubbleText = null; }
            else if (asleep && idle < 800) Wakeup(true);

            if (now > nextBlink) { blinkUntil = now + 0.14; nextBlink = now + 2.5 + rnd.NextDouble() * 3.5; }
            if (bubbleText != null && now > bubbleUntil) bubbleText = null;
            if (!asleep && now > nextChat) { if (bubbleText == null) Say(Pick(Idle)); nextChat = now + 150 + rnd.NextDouble() * 200; }

            // Vaikščiojimas apačioje ekrano
            Rectangle wa = Screen.FromPoint(new Point(Left + Width / 2, Top + Height / 2)).WorkingArea;
            if (walkEnabled && !asleep && !mouseDown && !walking && now > nextWander && now - jumpStart > 1)
            {
                walkTarget = (float)(wa.Left + rnd.NextDouble() * Math.Max(1, wa.Width - Width));
                if (Math.Abs(walkTarget - Left) > 40 * k) { walking = true; face = walkTarget > Left ? 1 : -1; }
                nextWander = now + 35 + rnd.NextDouble() * 60;
            }
            if (walking)
            {
                float step = (float)(60 * k * dt);
                float x = Left + face * step;
                if ((face > 0 && x >= walkTarget) || (face < 0 && x <= walkTarget)) { x = walkTarget; walking = false; SaveSettings(); }
                Left = (int)Math.Round(x);
            }

            hearts.RemoveAll(delegate (Heart h) { return now - h.Born > 1.0; });

            if (now - lastTopmost > 2) { lastTopmost = now; SetWindowPos(Handle, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010); }

            Render();
        }

        // ---------- Piešimas ----------
        void Render()
        {
            using (Graphics g = Graphics.FromImage(canvas))
            {
                g.Clear(Color.Transparent);
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
                g.ScaleTransform(k, k);

                float jy = 0, sx = 1, sy = 1;
                double jt = now - jumpStart;
                if (jt >= 0 && jt < 0.55)
                {
                    double p = jt / 0.55;
                    jy = -(float)(28 * Math.Sin(Math.PI * p));
                    if (p < 0.12) { sx = 1.1f; sy = 0.86f; } else { sx = 0.96f; sy = 1.05f; }
                }
                else
                {
                    double b = Math.Sin(now * 2 * Math.PI / (asleep ? 5.0 : 3.2));
                    sx = (float)(1 + 0.03 * b); sy = (float)(1 - 0.03 * b);
                }
                if (walking) jy -= (float)Math.Abs(Math.Sin(now * 9)) * 3f;

                // Akys žiūri į pelę (arba žemyn į klaviatūrą)
                float pdx = 0, pdy = 0;
                if (now < typingUntil) { pdy = 3.2f; pdx = -1f; }
                else
                {
                    Point c = Cursor.Position;
                    float ex = Left + k * (PetX + S * 55), ey = Top + k * (PetY + S * (62 + jy));
                    double a = Math.Atan2(c.Y - ey, c.X - ex);
                    float d = (float)Math.Min(3.5, Math.Sqrt((c.X - ex) * (c.X - ex) + (c.Y - ey) * (c.Y - ey)) / (40 * k));
                    pdx = (float)Math.Cos(a) * d * face; pdy = (float)Math.Sin(a) * d;
                }

                PetPose pose = new PetPose();
                pose.Jy = jy; pose.Sx = sx * face; pose.Sy = sy;
                pose.Pdx = pdx; pose.Pdy = pdy;
                pose.Closed = asleep || now < blinkUntil;
                pose.Asleep = asleep;
                pose.Happy = now < happyUntil;
                pose.Blush = now < happyUntil || now < typingUntil;
                pose.Tail = asleep ? 0f : (float)(1 + 13 * Math.Sin(now * 2 * Math.PI / (walking ? 0.7 : 1.6)));
                pose.Step = walking ? (float)Math.Sin(now * 9) : 0f;

                GraphicsState st = g.Save();
                g.TranslateTransform(PetX, PetY);
                g.ScaleTransform(S, S);
                DrawPet(g, pose);
                g.Restore(st);

                if (asleep) DrawZs(g);
                DrawHearts(g);
                DrawBubble(g);
            }
            Push();
        }

        void DrawZs(Graphics g)
        {
            for (int i = 0; i < 3; i++)
            {
                double ph = (now / 2.4 + i / 3.0) % 1.0;
                int alpha = (int)(255 * (ph < 0.3 ? ph / 0.3 : 1 - (ph - 0.3) / 0.7));
                using (Font f = new Font(zFont.FontFamily, (float)(9 + ph * 7), FontStyle.Bold))
                using (SolidBrush br = new SolidBrush(Color.FromArgb(Math.Max(0, Math.Min(255, alpha)), 0x6f, 0xae, 0x8f)))
                    g.DrawString("z", f, br, PetX + S * 88 + (float)ph * 18, PetY + S * 18 - (float)ph * 40);
            }
        }

        void DrawHearts(Graphics g)
        {
            foreach (Heart h in hearts)
            {
                double age = now - h.Born;
                if (age < 0) continue;
                float p = (float)age;
                float x = h.X + h.Vx * p, y = h.Y - 60 * p, s = 0.6f + 0.7f * p;
                int alpha = (int)(255 * (1 - p));
                using (GraphicsPath path = HeartPath(x, y, 14 * s))
                using (SolidBrush br = new SolidBrush(Color.FromArgb(Math.Max(0, alpha), 0xf0, 0x4a, 0x5e)))
                    g.FillPath(br, path);
            }
        }

        static GraphicsPath HeartPath(float cx, float cy, float size)
        {
            GraphicsPath p = new GraphicsPath();
            p.AddBezier(cx, cy + size * 0.45f, cx - size * 0.1f, cy + size * 0.3f, cx - size * 0.5f, cy + size * 0.1f, cx - size * 0.5f, cy - size * 0.12f);
            p.AddBezier(cx - size * 0.5f, cy - size * 0.12f, cx - size * 0.5f, cy - size * 0.45f, cx - size * 0.05f, cy - size * 0.45f, cx, cy - size * 0.2f);
            p.AddBezier(cx, cy - size * 0.2f, cx + size * 0.05f, cy - size * 0.45f, cx + size * 0.5f, cy - size * 0.45f, cx + size * 0.5f, cy - size * 0.12f);
            p.AddBezier(cx + size * 0.5f, cy - size * 0.12f, cx + size * 0.5f, cy + size * 0.1f, cx + size * 0.1f, cy + size * 0.3f, cx, cy + size * 0.45f);
            p.CloseFigure();
            return p;
        }

        void DrawBubble(Graphics g)
        {
            if (bubbleText == null) return;
            double fadeIn = Math.Min(1, (now - bubbleStart) / 0.18), fadeOut = Math.Min(1, (bubbleUntil - now) / 0.25);
            float a = (float)Math.Max(0, Math.Min(fadeIn, fadeOut));
            SizeF sz = g.MeasureString(bubbleText, bubbleFont, 190);
            float w = sz.Width + 22, h = sz.Height + 12;
            float x = Math.Max(4, Math.Min(W - w - 4, W / 2 - w / 2 + 10));
            float y = PetY + S * 12 - h - 8 + (1 - a) * 6;
            using (GraphicsPath path = RoundRect(x, y, w, h, 12))
            {
                GraphicsState st = g.Save();
                g.TranslateTransform(0, 3);
                using (SolidBrush sh = new SolidBrush(Color.FromArgb((int)(45 * a), 0, 0, 0))) g.FillPath(sh, path);
                g.Restore(st);
                using (SolidBrush bg = new SolidBrush(Color.FromArgb((int)(255 * a), 255, 255, 255)))
                {
                    g.FillPath(bg, path);
                    float tx = Math.Max(x + 14, Math.Min(x + w - 14, W / 2 + 6));
                    g.FillPolygon(bg, new PointF[] { new PointF(tx - 7, y + h - 1), new PointF(tx + 7, y + h - 1), new PointF(tx - 2, y + h + 8) });
                }
                using (SolidBrush fg = new SolidBrush(Color.FromArgb((int)(255 * a), 0x1d, 0x2b, 0x22)))
                    g.DrawString(bubbleText, bubbleFont, fg, new RectangleF(x + 11, y + 6, sz.Width + 2, sz.Height + 2));
            }
        }

        static GraphicsPath RoundRect(float x, float y, float w, float h, float r)
        {
            GraphicsPath p = new GraphicsPath();
            float d = r * 2;
            p.AddArc(x, y, d, d, 180, 90);
            p.AddArc(x + w - d, y, d, d, 270, 90);
            p.AddArc(x + w - d, y + h - d, d, d, 0, 90);
            p.AddArc(x, y + h - d, d, d, 90, 90);
            p.CloseFigure();
            return p;
        }

        void Push()
        {
            IntPtr screenDc = GetDC(IntPtr.Zero);
            IntPtr memDc = CreateCompatibleDC(screenDc);
            IntPtr hBmp = canvas.GetHbitmap(Color.FromArgb(0));
            IntPtr old = SelectObject(memDc, hBmp);
            try
            {
                SIZE size = new SIZE(canvas.Width, canvas.Height);
                POINT src = new POINT(0, 0);
                POINT dst = new POINT(Left, Top);
                BLENDFUNCTION blend = new BLENDFUNCTION();
                blend.BlendOp = 0; blend.BlendFlags = 0; blend.SourceConstantAlpha = 255; blend.AlphaFormat = 1;
                UpdateLayeredWindow(Handle, screenDc, ref dst, ref size, memDc, ref src, 0, ref blend, 2);
            }
            finally
            {
                SelectObject(memDc, old);
                DeleteObject(hBmp);
                DeleteDC(memDc);
                ReleaseDC(IntPtr.Zero, screenDc);
            }
        }

        Icon MakeIcon()
        {
            using (Bitmap bmp = new Bitmap(64, 64, System.Drawing.Imaging.PixelFormat.Format32bppArgb))
            {
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = SmoothingMode.AntiAlias;
                    g.TranslateTransform(-9, -6);
                    g.ScaleTransform(0.75f, 0.75f);
                    PetPose pose = new PetPose();
                    pose.Sx = 1; pose.Sy = 1;
                    DrawPet(g, pose);
                }
                IntPtr hIcon = bmp.GetHicon();
                Icon icon = (Icon)Icon.FromHandle(hIcon).Clone();
                DestroyIcon(hIcon);
                return icon;
            }
        }

        // ---------- Personažas (110 x 120 vienetų) ----------
        public class PetPose
        {
            public float Jy, Sx = 1, Sy = 1, Pdx, Pdy, Tail, Step;
            public bool Closed, Asleep, Happy, Blush;
        }

        static readonly Color Green = Color.FromArgb(0x3c, 0xb8, 0x83);
        static readonly Color DarkGreen = Color.FromArgb(0x2f, 0x9c, 0x70);
        static readonly Color Belly = Color.FromArgb(0xbf, 0xee, 0xdb);
        static readonly Color Ink = Color.FromArgb(0x1b, 0x2a, 0x22);
        static readonly Color Cap = Color.FromArgb(0xf2, 0xb3, 0x3d);
        static readonly Color CapDark = Color.FromArgb(0xd9, 0x95, 0x2a);
        static readonly Color Pink = Color.FromArgb(0xff, 0xb3, 0xa7);

        static void Quad(GraphicsPath p, float x0, float y0, float qx, float qy, float x1, float y1)
        {
            p.AddBezier(x0, y0, x0 + 2f / 3f * (qx - x0), y0 + 2f / 3f * (qy - y0), x1 + 2f / 3f * (qx - x1), y1 + 2f / 3f * (qy - y1), x1, y1);
        }

        static void Fill(Graphics g, Color c, GraphicsPath p) { using (SolidBrush b = new SolidBrush(c)) g.FillPath(b, p); }
        static void Ellipse(Graphics g, Color c, float cx, float cy, float rx, float ry) { using (SolidBrush b = new SolidBrush(c)) g.FillEllipse(b, cx - rx, cy - ry, rx * 2, ry * 2); }
        static void Poly(Graphics g, Color c, params float[] xy)
        {
            PointF[] pts = new PointF[xy.Length / 2];
            for (int i = 0; i < pts.Length; i++) pts[i] = new PointF(xy[i * 2], xy[i * 2 + 1]);
            using (SolidBrush b = new SolidBrush(c)) g.FillPolygon(b, pts);
        }
        static void Curve(Graphics g, float x0, float y0, float qx, float qy, float x1, float y1, float width)
        {
            using (GraphicsPath p = new GraphicsPath())
            using (Pen pen = new Pen(Ink, width))
            {
                pen.StartCap = LineCap.Round; pen.EndCap = LineCap.Round;
                Quad(p, x0, y0, qx, qy, x1, y1);
                g.DrawPath(pen, p);
            }
        }

        public static void DrawPet(Graphics g, PetPose pose)
        {
            // Šešėlis lieka ant žemės
            float shrink = 1 + pose.Jy / 80f;
            Ellipse(g, Color.FromArgb(55, 0, 0, 0), 55, 114, 34 * shrink, 5 * shrink);

            GraphicsState st = g.Save();
            g.TranslateTransform(55, 110 + pose.Jy);
            g.ScaleTransform(pose.Sx, pose.Sy);
            g.TranslateTransform(-55, -110);

            // Uodega
            GraphicsState ts = g.Save();
            g.TranslateTransform(22, 92); g.RotateTransform(pose.Tail); g.TranslateTransform(-22, -92);
            using (GraphicsPath tail = new GraphicsPath())
            {
                Quad(tail, 24, 92, 2, 88, 8, 68);
                Quad(tail, 8, 68, 12, 60, 18, 66);
                Quad(tail, 18, 66, 14, 78, 28, 84);
                tail.CloseFigure();
                Fill(g, DarkGreen, tail);
            }
            g.Restore(ts);

            // Ausys
            Poly(g, DarkGreen, 26, 40, 20, 14, 42, 30);
            Poly(g, Pink, 27, 34, 24, 20, 36, 30);
            Poly(g, DarkGreen, 84, 40, 90, 14, 68, 30);
            Poly(g, Pink, 83, 34, 86, 20, 74, 30);

            // Kojos
            Ellipse(g, DarkGreen, 34, 108 - Math.Max(0, pose.Step) * 3, 10, 6);
            Ellipse(g, DarkGreen, 76, 108 - Math.Max(0, -pose.Step) * 3, 10, 6);

            // Kūnas ir pilvukas
            Ellipse(g, Green, 55, 72, 38, 40);
            Ellipse(g, Belly, 55, 88, 24, 20);

            // Kepurė
            using (GraphicsPath cap = new GraphicsPath())
            {
                Quad(cap, 24, 42, 55, 16, 86, 42);
                cap.AddLine(86, 42, 86, 46);
                Quad(cap, 86, 46, 55, 34, 24, 46);
                cap.CloseFigure();
                Fill(g, Cap, cap);
            }
            using (GraphicsPath brim = new GraphicsPath())
            {
                Quad(brim, 58, 44, 80, 40, 96, 50);
                Quad(brim, 96, 50, 84, 54, 64, 49);
                brim.CloseFigure();
                Fill(g, CapDark, brim);
            }
            Ellipse(g, CapDark, 55, 27, 4, 4);

            // Akys
            float[] eyes = { 41, 69 };
            foreach (float cx in eyes)
            {
                const float cy = 62;
                if (pose.Happy) Curve(g, cx - 7, cy + 3, cx, cy - 6, cx + 7, cy + 3, 2.6f);
                else if (pose.Closed) Curve(g, cx - 7, cy + 1, cx, cy + 6, cx + 7, cy + 1, 2.4f);
                else
                {
                    Ellipse(g, Color.White, cx, cy, 9, 10);
                    Ellipse(g, Ink, cx + pose.Pdx, cy + 1 + pose.Pdy, 5, 5);
                    Ellipse(g, Color.White, cx + 2 + pose.Pdx, cy - 2 + pose.Pdy, 1.6f, 1.6f);
                }
            }

            // Skruostai
            if (pose.Blush)
            {
                Ellipse(g, Color.FromArgb(140, 0xff, 0x7d, 0x8c), 30, 76, 6, 3.5f);
                Ellipse(g, Color.FromArgb(140, 0xff, 0x7d, 0x8c), 80, 76, 6, 3.5f);
            }

            // Burna
            if (pose.Asleep) Ellipse(g, Ink, 55, 79, 2.6f, 2.2f);
            else if (pose.Happy)
            {
                using (GraphicsPath m = new GraphicsPath())
                {
                    Quad(m, 45, 74, 55, 88, 65, 74);
                    m.CloseFigure();
                    Fill(g, Color.FromArgb(0x8a, 0x2c, 0x3a), m);
                }
                Curve(g, 45, 74, 55, 88, 65, 74, 2.2f);
                Curve(g, 45, 74, 55, 74, 65, 74, 2.2f);
            }
            else Curve(g, 48, 76, 55, 81, 62, 76, 2.4f);

            g.Restore(st);
        }
    }
}
