import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TrueWorks Limited — Business Operating Systems for African Organizations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0B2545 0%, #13335c 60%, #1b3f6e 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "#C9A227",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 800,
              color: "#0B2545",
            }}
          >
            TW
          </div>
          <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "0.02em" }}>
            TrueWorks Limited
          </span>
        </div>
        <div
          style={{
            fontSize: "60px",
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: "900px",
            marginBottom: "24px",
          }}
        >
          Business Operating Systems for African Organizations
        </div>
        <div style={{ fontSize: "26px", color: "rgba(255,255,255,0.7)", maxWidth: "820px" }}>
          Premium Excel templates, financial models, and dashboards — instant download.
        </div>
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "22px",
            color: "#C9A227",
            fontWeight: 700,
          }}
        >
          trueworksug.com
        </div>
      </div>
    ),
    { ...size }
  );
}
