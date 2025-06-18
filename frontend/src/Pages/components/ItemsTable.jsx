import React, { useState, useEffect, useRef } from "react";
import {
  useTheme,
  useMediaQuery,
  Grid,
  TextField,
  Box,
  Paper,
  Typography,
} from "@mui/material";

export default function ItemsTable({ items, onChangeItem, onTabFromTable }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // State for tracking the currently selected cell
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const inputRefs = useRef([]); // Refs for input fields

  // Focus the selected cell whenever it changes
  useEffect(() => {
    if (inputRefs.current[selectedCell.row]?.[selectedCell.col]) {
      inputRefs.current[selectedCell.row][selectedCell.col].focus();
    }
  }, [selectedCell]);

  // Handle keyboard navigation
  const handleKeyDown = (e, rowIndex, colIndex) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: Math.max(0, prev.row - 1),
          col: prev.col,
        }));
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: Math.min(items.length - 1, prev.row + 1),
          col: prev.col,
        }));
        break;
      case "ArrowLeft":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: prev.row,
          col: Math.max(0, prev.col - 1),
        }));
        break;
      case "ArrowRight":
        e.preventDefault();
        setSelectedCell((prev) => ({
          row: prev.row,
          col: Math.min(1, prev.col + 1), // Only 2 columns (qty and rate)
        }));
        break;
      case "Tab":
      case "Enter":
        e.preventDefault();
        // If we're at the last editable cell, move to next field
        if (rowIndex === items.length - 1 && colIndex === 1) {
          if (onTabFromTable) {
            onTabFromTable();
          }
        } else {
          // Move to next cell
          if (colIndex === 1) {
            // Move to next row, first column
            setSelectedCell({ row: rowIndex + 1, col: 0 });
          } else {
            // Move to next column
            setSelectedCell({ row: rowIndex, col: colIndex + 1 });
          }
        }
        break;
      default:
        break;
    }
  };

  return (
    <Box
      sx={{
        maxHeight: 400,
        overflowY: "auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
      }}
    >
      {/* Header Row */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={5}>
          <Typography variant="subtitle2" fontWeight="bold">
            Item Description
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" fontWeight="bold" align="center">
            Qty
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" fontWeight="bold" align="center">
            Rate
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="subtitle2" fontWeight="bold" align="right">
            Amount
          </Typography>
        </Grid>
      </Grid>

      {/* Data Rows */}
      {items.map((row, rowIndex) => (
        <Grid
          container
          spacing={1}
          key={rowIndex}
          sx={{
            mb: 1,
            backgroundColor:
              selectedCell.row === rowIndex ? "action.hover" : "background.paper",
            borderRadius: 1,
            p: 1,
          }}
        >
          {/* Item Description */}
          <Grid item xs={5}>
            <Box
              sx={{
                p: 1,
                backgroundColor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">{row.itemDescription}</Typography>
            </Box>
          </Grid>

          {/* Quantity */}
          <Grid item xs={2} sx={{ minWidth: isSmallScreen ? '65px' : 'auto' }}>
            <TextField
              type="number"
              value={row.qty || ""}
              onChange={(e) => onChangeItem(rowIndex, "qty", e.target.value)}
              size="small"
              fullWidth
              data-item-row={rowIndex}
              data-field="qty"
              inputRef={(el) => {
                if (!inputRefs.current[rowIndex]) {
                  inputRefs.current[rowIndex] = [];
                }
                inputRefs.current[rowIndex][0] = el;
              }}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
              inputProps={{
                style: { textAlign: "center" },
                "aria-label": `Quantity for ${row.itemDescription}`,
              }}
              sx={{
                backgroundColor:
                  selectedCell.row === rowIndex && selectedCell.col === 0
                    ? "action.selected"
                    : "background.paper",
              }}
            />
          </Grid>

          {/* Rate */}
          <Grid item xs={2} sx={{ minWidth: isSmallScreen ? '65px' : 'auto' }}>
            <TextField
              type="number"
              step="0.01"
              value={row.rate || ""}
              onChange={(e) => onChangeItem(rowIndex, "rate", e.target.value)}
              size="small"
              fullWidth
              data-item-row={rowIndex}
              data-field="rate"
              inputRef={(el) => {
                if (!inputRefs.current[rowIndex]) {
                  inputRefs.current[rowIndex] = [];
                }
                inputRefs.current[rowIndex][1] = el;
              }}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
              inputProps={{
                style: { textAlign: "center" },
                "aria-label": `Rate for ${row.itemDescription}`,
              }}
              sx={{
                backgroundColor:
                  selectedCell.row === rowIndex && selectedCell.col === 1
                    ? "action.selected"
                    : "background.paper",
              }}
            />
          </Grid>

          {/* Amount */}
          <Grid item xs={3}>
            <Box
              sx={{
                p: 1,
                backgroundColor: "background.default",
                borderRadius: 1,
                textAlign: "right",
              }}
            >
              <Typography variant="body2">
                {row.amount?.toFixed(2) || "0.00"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      ))}
    </Box>
  );
}