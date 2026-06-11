import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from google import genai
from google.genai import types
from dotenv import load_dotenv
import io
import os

# ── Load env and init Gemini client ──────────────────────────────────────────
load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or st.secrets.get("GEMINI_API_KEY")
GEMINI_MODEL   = "gemini-2.5-flash"

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="DataLens AI",
    page_icon="",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
  .stApp { background: #0D1117; color: #E6EDF3; }
  section[data-testid="stSidebar"] { background: #161B22; border-right: 1px solid #21262D; }

  .metric-card {
    background: #161B22; border: 1px solid #21262D; border-radius: 10px;
    padding: 1.2rem 1.5rem; margin-bottom: 0.75rem; transition: border-color 0.2s;
  }
  .metric-card:hover { border-color: #388BFD; }
  .metric-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
                  color: #7D8590; text-transform: uppercase; margin-bottom: 0.3rem; }
  .metric-value { font-size: 1.6rem; font-weight: 700; color: #E6EDF3; }
  .metric-sub   { font-size: 0.78rem; color: #7D8590; margin-top: 0.2rem; }

  .chat-bubble-user {
    background: #1C2128; border: 1px solid #30363D;
    border-radius: 12px 12px 4px 12px; padding: 0.9rem 1.2rem;
    margin: 0.6rem 0; margin-left: 18%; font-size: 0.9rem; color: #E6EDF3;
  }
  .chat-bubble-ai {
    background: #0D2340; border: 1px solid #1A4080;
    border-radius: 12px 12px 12px 4px; padding: 0.9rem 1.2rem;
    margin: 0.6rem 0; margin-right: 18%; font-size: 0.9rem;
    color: #E6EDF3; line-height: 1.7;
  }
  .chat-label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em;
                color: #7D8590; text-transform: uppercase; margin-bottom: 0.35rem; }

  .section-title {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; color: #388BFD;
    text-transform: uppercase; border-bottom: 1px solid #21262D;
    padding-bottom: 0.5rem; margin-bottom: 1rem;
  }
  .stButton > button {
    background: #238636 !important; color: #fff !important;
    border: none !important; border-radius: 6px !important;
    font-weight: 600 !important; font-size: 0.85rem !important;
    padding: 0.5rem 1.2rem !important;
  }
  .stButton > button:hover { background: #2EA043 !important; }
  .stTextInput > div > div > input {
    background: #161B22 !important; color: #E6EDF3 !important;
    border: 1px solid #30363D !important; border-radius: 8px !important;
  }
  .stTextInput > div > div > input:focus {
    border-color: #388BFD !important;
    box-shadow: 0 0 0 2px rgba(56,139,253,0.15) !important;
  }
  .stSelectbox > div > div {
    background: #161B22 !important; border: 1px solid #30363D !important;
    border-radius: 8px !important; color: #E6EDF3 !important;
  }
  div[data-testid="stFileUploader"] {
    background: #161B22; border: 2px dashed #30363D !important; border-radius: 12px;
  }
</style>
""", unsafe_allow_html=True)


# ── Data helpers ──────────────────────────────────────────────────────────────

def load_file(uploaded_file) -> dict:
    name = uploaded_file.name.lower()
    if name.endswith(".csv"):
        return {"Sheet1": pd.read_csv(uploaded_file)}
    xls = pd.ExcelFile(uploaded_file)
    return {s: xls.parse(s) for s in xls.sheet_names}


def df_summary(df: pd.DataFrame) -> str:
    buf = io.StringIO()
    buf.write(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n\n")
    buf.write("Columns & dtypes:\n")
    for col, dtype in df.dtypes.items():
        buf.write(f"  {col} ({dtype})\n")
    buf.write("\nFirst 5 rows (CSV):\n")
    buf.write(df.head(5).to_csv(index=False))
    buf.write("\nDescriptive statistics:\n")
    buf.write(df.describe(include="all").to_string())
    nulls = df.isnull().sum()
    if nulls.any():
        buf.write("\n\nMissing values:\n")
        buf.write(nulls[nulls > 0].to_string())
    return buf.getvalue()


def build_system(df: pd.DataFrame, sheet: str) -> str:
    return f"""You are DataLens, an expert data analyst assistant.
The user uploaded a dataset called "{sheet}".

DATASET SUMMARY:
{df_summary(df)}

Instructions:
- Answer questions clearly using the actual data values.
- Highlight trends, anomalies, top/bottom performers, and recommendations.
- Use bullet points for lists.
- When a chart would help, embed this directive on its own line:
  CHART:<type>|<x_col>|<y_col>|<title>
  where type is: bar, line, scatter, histogram, box, or pie
"""


def ask_gemini(system: str, history: list) -> str:
    contents = [
        types.Content(role="user",  parts=[types.Part(text=f"[SYSTEM]\n{system}")]),
        types.Content(role="model", parts=[types.Part(text="Understood. I'm DataLens, ready to analyse.")]),
    ]
    for m in history:
        role = "user" if m["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=m["content"])]))

    resp = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(temperature=0.3, max_output_tokens=1800),
    )
    return resp.text


def parse_chart(text: str, df: pd.DataFrame):
    if "CHART:" not in text:
        return None
    try:
        line  = next(l for l in text.split("\n") if "CHART:" in l)
        parts = line.split("CHART:")[1].split("|")
        ctype, xcol, ycol = parts[0].strip(), parts[1].strip(), parts[2].strip()
        title = parts[3].strip() if len(parts) > 3 else f"{ycol} by {xcol}"
        kw = dict(template="plotly_dark", title=title)
        lay = dict(paper_bgcolor="#161B22", plot_bgcolor="#0D1117",
                   font_color="#CDD9E5", margin=dict(t=40,b=30,l=40,r=20))

        if ctype == "bar":
            agg = df.groupby(xcol)[ycol].sum().reset_index()
            fig = px.bar(agg, x=xcol, y=ycol, color=ycol,
                         color_continuous_scale=[[0,"#1A4080"],[1,"#388BFD"]], **kw)
            fig.update_layout(coloraxis_showscale=False)
        elif ctype == "line":
            fig = px.line(df.sort_values(xcol), x=xcol, y=ycol,
                          color_discrete_sequence=["#388BFD"], **kw)
        elif ctype == "scatter":
            fig = px.scatter(df, x=xcol, y=ycol,
                             color_discrete_sequence=["#DB61A2"], opacity=0.7, **kw)
        elif ctype == "histogram":
            fig = px.histogram(df, x=xcol, nbins=30,
                               color_discrete_sequence=["#388BFD"], **kw)
        elif ctype == "box":
            fig = px.box(df, x=xcol, y=ycol, color_discrete_sequence=["#388BFD"], **kw)
        elif ctype == "pie":
            agg = df.groupby(xcol)[ycol].sum().reset_index()
            fig = px.pie(agg, names=xcol, values=ycol,
                         color_discrete_sequence=px.colors.sequential.Blues_r, **kw)
        else:
            return None
        fig.update_layout(**lay)
        return fig
    except Exception:
        return None


def auto_charts(df: pd.DataFrame) -> list:
    figs = []
    num  = df.select_dtypes(include="number").columns.tolist()
    cat  = df.select_dtypes(include=["object","category"]).columns.tolist()
    dt   = df.select_dtypes(include="datetime").columns.tolist()
    lay  = dict(paper_bgcolor="#161B22", plot_bgcolor="#0D1117",
                font_color="#CDD9E5", margin=dict(t=40,b=30,l=40,r=20))

    if dt and num:
        fig = px.line(df.sort_values(dt[0]), x=dt[0], y=num[0],
                      title=f"{num[0]} over time", template="plotly_dark",
                      color_discrete_sequence=["#388BFD"])
        fig.update_layout(**lay); figs.append(fig)

    if cat and num:
        agg = df.groupby(cat[0])[num[0]].sum().nlargest(12).reset_index()
        fig = px.bar(agg, x=cat[0], y=num[0], title=f"Top {cat[0]} by {num[0]}",
                     template="plotly_dark", color=num[0],
                     color_continuous_scale=[[0,"#1A4080"],[1,"#388BFD"]])
        fig.update_layout(**lay, coloraxis_showscale=False)
        fig.update_traces(marker_line_width=0); figs.append(fig)

    if num:
        fig = px.histogram(df, x=num[0], nbins=30, title=f"Distribution of {num[0]}",
                           template="plotly_dark", color_discrete_sequence=["#3FB950"])
        fig.update_layout(**lay); figs.append(fig)

    if len(num) >= 2:
        fig = px.scatter(df, x=num[0], y=num[1], opacity=0.7,
                         title=f"{num[0]} vs {num[1]}", template="plotly_dark",
                         color_discrete_sequence=["#DB61A2"])
        fig.update_layout(**lay); figs.append(fig)

    return figs[:4]


QUICK_QS = [
    "Summarise this dataset",
    "What trends do you see?",
    "Which items perform best?",
    "Highlight any anomalies",
    "Give me recommendations",
    "Show a chart of the top category",
]

# ── Session state ─────────────────────────────────────────────────────────────
if "messages"     not in st.session_state: st.session_state.messages     = []
if "dataframes"   not in st.session_state: st.session_state.dataframes   = {}
if "active_sheet" not in st.session_state: st.session_state.active_sheet = None


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 📊 DataLens AI")
    st.markdown("<div style='color:#7D8590;font-size:0.8rem;margin-top:-0.5rem;margin-bottom:1.5rem;'>Excel & CSV Intelligence</div>", unsafe_allow_html=True)

    st.markdown("<div class='section-title'>Upload Your Data</div>", unsafe_allow_html=True)
    uploaded = st.file_uploader(
        "Drop file here",
        type=["csv", "xlsx", "xls", "xlsm"],
        label_visibility="collapsed",
    )

    if uploaded:
        with st.spinner("Reading file…"):
            dfs = load_file(uploaded)
            if dfs:
                st.session_state.dataframes   = dfs
                st.session_state.active_sheet = list(dfs.keys())[0]
                st.session_state.messages     = []
                st.success(f"✓ Loaded — {list(dfs.values())[0].shape[0]:,} rows")

    if st.session_state.dataframes:
        if len(st.session_state.dataframes) > 1:
            st.markdown("<div class='section-title' style='margin-top:1.5rem'>Sheet</div>", unsafe_allow_html=True)
            st.session_state.active_sheet = st.selectbox(
                "Sheet", list(st.session_state.dataframes.keys()), label_visibility="collapsed")

        if st.button("🗑  Clear chat", width="stretch"):
            st.session_state.messages = []
            st.rerun()

        st.markdown("<div class='section-title' style='margin-top:1.5rem'>Dataset Stats</div>", unsafe_allow_html=True)
        df_s = st.session_state.dataframes[st.session_state.active_sheet]
        st.markdown(f"""
        <div class='metric-card'>
          <div class='metric-label'>Rows × Columns</div>
          <div class='metric-value'>{df_s.shape[0]:,} × {df_s.shape[1]}</div>
        </div>
        <div class='metric-card'>
          <div class='metric-label'>Numeric Columns</div>
          <div class='metric-value'>{df_s.select_dtypes('number').shape[1]}</div>
        </div>
        <div class='metric-card'>
          <div class='metric-label'>Missing Values</div>
          <div class='metric-value'>{df_s.isnull().sum().sum():,}</div>
          <div class='metric-sub'>{df_s.isnull().mean().mean()*100:.1f}% of cells</div>
        </div>
        """, unsafe_allow_html=True)


# ── Landing ───────────────────────────────────────────────────────────────────
if not st.session_state.dataframes:
    st.markdown("""
    <div style='text-align:center;padding:6rem 2rem;'>
      <div style='font-size:3.5rem;margin-bottom:1rem;'>📊</div>
      <h1 style='font-size:2.2rem;font-weight:700;color:#E6EDF3;margin-bottom:0.75rem;'>DataLens AI</h1>
      <p style='color:#7D8590;font-size:1rem;max-width:440px;margin:0 auto 2rem;line-height:1.8;'>
        Upload a CSV or Excel file and ask questions about your data in plain English.
        Charts and insights generated automatically.
      </p>
      <div style='display:flex;justify-content:center;gap:0.6rem;flex-wrap:wrap;max-width:480px;margin:0 auto;'>
        <span style='background:#161B22;border:1px solid #21262D;border-radius:20px;padding:0.3rem 0.9rem;font-size:0.8rem;color:#7D8590;'>📈 Trend Analysis</span>
        <span style='background:#161B22;border:1px solid #21262D;border-radius:20px;padding:0.3rem 0.9rem;font-size:0.8rem;color:#7D8590;'>🏆 Top Performers</span>
        <span style='background:#161B22;border:1px solid #21262D;border-radius:20px;padding:0.3rem 0.9rem;font-size:0.8rem;color:#7D8590;'>🔍 Anomaly Detection</span>
        <span style='background:#161B22;border:1px solid #21262D;border-radius:20px;padding:0.3rem 0.9rem;font-size:0.8rem;color:#7D8590;'>💡 Recommendations</span>
        <span style='background:#161B22;border:1px solid #21262D;border-radius:20px;padding:0.3rem 0.9rem;font-size:0.8rem;color:#7D8590;'>📊 Auto Charts</span>
      </div>
      <div style='margin-top:2.5rem;color:#7D8590;font-size:0.85rem;'>
        ← Upload a file in the sidebar to get started
      </div>
    </div>
    """, unsafe_allow_html=True)
    st.stop()


# ── Active data ───────────────────────────────────────────────────────────────
df    = st.session_state.dataframes[st.session_state.active_sheet]
sheet = st.session_state.active_sheet

tab_chat, tab_explore, tab_data = st.tabs(["💬 Chat", "📈 Explore", "🗂 Data Preview"])


# ─── TAB: Chat ────────────────────────────────────────────────────────────────
with tab_chat:
    system = build_system(df, sheet)

    if not st.session_state.messages:
        st.markdown("""
        <div style='text-align:center;padding:2rem;color:#7D8590;font-size:0.9rem;'>
          Ask anything about your data — or use a quick question below.
        </div>""", unsafe_allow_html=True)

    for msg in st.session_state.messages:
        if msg["role"] == "user":
            st.markdown(f"""
            <div class='chat-bubble-user'>
              <div class='chat-label'>You</div>{msg['content']}
            </div>""", unsafe_allow_html=True)
        else:
            # Strip CHART: directives from visible text
            clean = "\n".join(l for l in msg["content"].split("\n") if not l.strip().startswith("CHART:"))
            # Label in HTML, content via st.markdown so bullets/bold/newlines render
            st.markdown("<div class='chat-bubble-ai'><div class='chat-label'>DataLens AI</div>", unsafe_allow_html=True)
            st.markdown(clean)
            st.markdown("</div>", unsafe_allow_html=True)
            if "chart_fig" in msg:
                st.plotly_chart(msg["chart_fig"], width="stretch")

    # Quick questions
    st.markdown("<div style='margin:1.2rem 0 0.5rem;color:#7D8590;font-size:0.72rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;'>Quick questions</div>",
                unsafe_allow_html=True)
    cols = st.columns(3)
    for i, q in enumerate(QUICK_QS):
        with cols[i % 3]:
            if st.button(q, key=f"qq_{i}", width="stretch"):
                st.session_state["pending_q"] = q

    col_inp, col_btn = st.columns([5, 1])
    with col_inp:
        user_input = st.text_input("Message", placeholder="Ask about your data…",
                                   label_visibility="collapsed", key="chat_input")
    with col_btn:
        send = st.button("Send", width="stretch")

    final_q = None
    if send and user_input.strip():
        final_q = user_input.strip()
    elif "pending_q" in st.session_state:
        final_q = st.session_state.pop("pending_q")

    if final_q:
        st.session_state.messages.append({"role": "user", "content": final_q})
        with st.spinner("Analysing…"):
            try:
                reply = ask_gemini(system, st.session_state.messages)
                entry = {"role": "assistant", "content": reply}
                fig   = parse_chart(reply, df)
                if fig:
                    entry["chart_fig"] = fig
                st.session_state.messages.append(entry)
            except Exception as e:
                st.error(f"Error: {e}")
        st.rerun()


# ─── TAB: Explore ─────────────────────────────────────────────────────────────

with tab_explore:
    st.markdown("<div class='section-title'>Overview</div>", unsafe_allow_html=True)
    num_cols = df.select_dtypes(include="number").columns.tolist()

    if num_cols:
        kpi_cols = st.columns(min(4, len(num_cols)))
        for i, col in enumerate(num_cols[:4]):
            with kpi_cols[i]:
                st.markdown(f"""
                <div class='metric-card'>
                  <div class='metric-label'>{col}</div>
                  <div class='metric-value'>{df[col].sum():,.0f}</div>
                  <div class='metric-sub'>avg {df[col].mean():,.1f} &nbsp;|&nbsp; max {df[col].max():,.0f}</div>
                </div>""", unsafe_allow_html=True)

    st.markdown("<div class='section-title' style='margin-top:1.5rem'>Auto Charts</div>", unsafe_allow_html=True)
    figs = auto_charts(df)
    if figs:
        r1 = st.columns(min(2, len(figs)))
        for i, fig in enumerate(figs[:2]):
            with r1[i]: st.plotly_chart(fig, width="stretch")
        if len(figs) > 2:
            r2 = st.columns(min(2, len(figs) - 2))
            for i, fig in enumerate(figs[2:]):
                with r2[i]: st.plotly_chart(fig, width="stretch")
    else:
        st.info("No chartable columns detected.")

    st.markdown("<div class='section-title' style='margin-top:1.5rem'>Custom Chart</div>", unsafe_allow_html=True)
    all_cols = df.columns.tolist()
    c1,c2,c3,c4 = st.columns(4)
    with c1: ctype  = st.selectbox("Type",        ["bar","line","scatter","histogram","box","pie"])
    with c2: x_col  = st.selectbox("X / Category", all_cols)
    with c3: y_col  = st.selectbox("Y / Value",    num_cols if num_cols else all_cols,
                                    index=min(1,len(num_cols)-1) if len(num_cols)>1 else 0)
    with c4: agg_fn = st.selectbox("Aggregation",  ["sum","mean","count","max","min"])

    if st.button("Generate Chart"):
        try:
            lay = dict(paper_bgcolor="#161B22", plot_bgcolor="#0D1117",
                       font_color="#CDD9E5", margin=dict(t=40,b=30,l=40,r=20))
            if ctype == "histogram":
                cfig = px.histogram(df, x=x_col, template="plotly_dark",
                                    color_discrete_sequence=["#388BFD"])
            elif ctype == "pie":
                agg = df.groupby(x_col)[y_col].agg(agg_fn).reset_index()
                cfig = px.pie(agg, names=x_col, values=y_col, template="plotly_dark",
                              color_discrete_sequence=px.colors.sequential.Blues_r)
            elif ctype == "scatter":
                cfig = px.scatter(df, x=x_col, y=y_col, template="plotly_dark",
                                  color_discrete_sequence=["#DB61A2"], opacity=0.7)
            elif ctype == "box":
                cfig = px.box(df, x=x_col, y=y_col, template="plotly_dark",
                               color_discrete_sequence=["#388BFD"])
            else:
                agg = df.groupby(x_col)[y_col].agg(agg_fn).reset_index()
                if ctype == "bar":
                    cfig = px.bar(agg, x=x_col, y=y_col, template="plotly_dark",
                                  color=y_col, color_continuous_scale=[[0,"#1A4080"],[1,"#388BFD"]])
                    cfig.update_layout(coloraxis_showscale=False)
                else:
                    cfig = px.line(agg.sort_values(x_col), x=x_col, y=y_col,
                                   template="plotly_dark", color_discrete_sequence=["#388BFD"])
            cfig.update_layout(**lay)
            st.plotly_chart(cfig, width="stretch")
        except Exception as e:
            st.error(f"Chart error: {e}")

    if len(num_cols) >= 2:
        st.markdown("<div class='section-title' style='margin-top:1.5rem'>Correlation Heatmap</div>", unsafe_allow_html=True)
        corr = df[num_cols].corr()
        heat = go.Figure(data=go.Heatmap(
            z=corr.values, x=corr.columns, y=corr.index,
            colorscale=[[0,"#1A4080"],[0.5,"#0D1117"],[1,"#388BFD"]],
            zmid=0, text=corr.round(2).values, texttemplate="%{text}",
        ))
        heat.update_layout(paper_bgcolor="#161B22", font_color="#CDD9E5",
                            margin=dict(t=30,b=30,l=40,r=20), height=380)
        st.plotly_chart(heat, width="stretch")


# ─── TAB: Data Preview ────────────────────────────────────────────────────────
with tab_data:
    st.markdown(f"<div class='section-title'>{sheet} — {df.shape[0]:,} rows × {df.shape[1]} columns</div>",
                unsafe_allow_html=True)
    c1, c2 = st.columns([3, 1])
    with c1:
        search = st.text_input("Filter", placeholder="Search across all columns",
                                label_visibility="collapsed")
    with c2:
        n_rows = st.selectbox("Show", [20, 50, 100, 500], label_visibility="collapsed")

    display_df = df
    if search:
        mask = df.astype(str).apply(lambda col: col.str.contains(search, case=False, na=False)).any(axis=1)
        display_df = df[mask]
        st.markdown(f"<span style='color:#3FB950;font-weight:600;font-size:0.85rem;'>✓ {len(display_df):,} rows match</span>",
                    unsafe_allow_html=True)

    st.dataframe(display_df.head(n_rows), width="stretch", height=420)

    with st.expander("Column schema"):
        schema = pd.DataFrame({
            "Column":   df.columns,
            "Type":     df.dtypes.astype(str).values,
            "Non-null": df.notna().sum().values,
            "Nulls":    df.isnull().sum().values,
            "Unique":   [df[c].nunique() for c in df.columns],
        })
        st.dataframe(schema, width="stretch", hide_index=True)

    st.download_button("⬇ Download as CSV", df.to_csv(index=False).encode(),
                        f"{sheet}.csv", "text/csv")
