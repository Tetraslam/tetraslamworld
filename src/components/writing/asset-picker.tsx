"use client";
import { useEffect, useState } from "react";
import { mediaUrl } from "../../../shared/writing";
export function AssetPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [assets, setAssets] = useState<
    Array<{ id: string; filename: string; contentType: string }>
  >([]);
  useEffect(() => {
    let active = true;
    void fetch("/api/writing/assets")
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((data) => {
        if (active) setAssets(data.assets || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="writing-cover-picker">
      {value && <img src={mediaUrl(value)} alt="Social preview" />}
      <select
        aria-label="Social preview image"
        value={value.startsWith("writing-asset:") ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">no cover</option>
        {assets
          .filter((asset) => asset.contentType.startsWith("image/"))
          .map((asset) => (
            <option key={asset.id} value={`writing-asset:${asset.id}`}>
              {asset.filename}
            </option>
          ))}
      </select>
      <details>
        <summary>use an image URL</summary>
        <input
          aria-label="Social preview URL"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </details>
    </div>
  );
}
