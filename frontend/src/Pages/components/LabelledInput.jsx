import React from "react";

export default function LabelledInput({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  style = {},
}) {
  return (
    <div style={{ marginBottom: "8px", ...style }}>
      <label style={{ marginRight: "8px", fontSize: "1.1rem" }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        style={{ 
          width: 150,
          height: 32,
          fontSize: "1.1rem",
          padding: "4px 8px"
        }}
      />
    </div>
  );
}
