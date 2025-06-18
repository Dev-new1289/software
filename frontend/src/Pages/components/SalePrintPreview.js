import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import logo from '../../assets/logo.png';

export default function SalePrintPreview({ open, onClose, saleData, onPrint }) {
  const { invoiceNo, date, customer, area, items, netAmount, specialLess, lessAmount, receivable, prevBalance, totalAmount, remarks } = saleData;
  const [pages, setPages] = useState([]);

  // Filter out items with zero quantity
  const filteredItems = items.filter(item => item.qty > 0);

  // Calculate items per page based on available space
  const calculatePages = () => {
    const itemsPerPage = 22; // Approximate number of items that fit on one page
    const result = [];
    
    for (let i = 0; i < filteredItems.length; i += itemsPerPage) {
      result.push(filteredItems.slice(i, i + itemsPerPage));
    }
    
    setPages(result);
  };

  useEffect(() => {
    calculatePages();
  }, [items]);

  const handlePrint = () => {
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Invoice ${invoiceNo}</title>
          <style>
            @page {
              size: letter;
              margin: 0;
            }
            @media print {
              .page-break { page-break-after: always; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .print-page {
              width: 8in;
              height: 10.5in;
              margin: 0 auto;
              position: relative;
            }
            .logo {
              position: absolute;
              left: 0.25in;
              top: 0.25in;
              width: 1.5in;
              height: 1.5in;
            }
            .header {
              position: absolute;
              left: 2in;
              top: 0.25in;
            }
            .header h1 {
              font-size: 28pt;
              font-weight: bold;
              margin: 0;
              font-family: Arial;
            }
            .header p {
              font-size: 14pt;
              font-weight: bold;
              margin: 5px 0;
              font-family: Arial;
            }
            .header .invoice-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 0.1in;
            }
            .header .invoice-info .inv-no {
              font-size: 14pt;
              font-weight: bold;
            }
            .header .invoice-info .date {
              font-size: 14pt;
              font-weight: bold;
            }
            .items-table {
              position: absolute;
              left: 0.25in;
              top: 2in;
              width: 7.5in;
              border-collapse: collapse;
            }
            .items-table th {
              height: 0.25in;
              border: 1px solid black;
              font-size: 12pt;
              font-weight: bold;
              text-align: center;
              font-family: Arial;
              padding: 0.03in;
              vertical-align: middle;
            }
            .items-table th:first-child {
              text-align: center;
              width: 0.5in;
            }
            .items-table th:nth-child(2) {
              width: 4.5in;
              text-align: left;
            }
            .items-table th:nth-child(3) {
              width: 0.9in;
            }
            .items-table th:last-child {
              width: 1in;
            }
            .items-table td {
              height: 0.2in;
              border: 1px solid black;
              font-size: 12pt;
              text-align: right;
              padding: 0.03in;
              font-family: Arial;
              vertical-align: middle;
            }
            .items-table td:nth-child(1) {
              text-align: center;
            }
            .items-table td:nth-child(2) {
              text-align: left;
            }
            .footer {
              position: absolute;
              bottom: 2in;
              left: 0.25in;
              width: 7.5in;
            }
            .footer-left {
              position: absolute;
              left: 0;
              width: 4.5in;
            }
            .footer-right {
              position: absolute;
              right: 0;
              width: 3in;
            }
            .amounts-table {
              width: 100%;
              border-collapse: collapse;
            }
            .amounts-table td {
              height: 0.25in;
              border: 1px solid black;
              font-size: 12pt;
              text-align: right;
              padding: 0.03in;
              font-family: Arial;
              vertical-align: middle;
            }
            .amounts-table td:first-child {
              width: 3.5in;
              text-align: right;
              padding-left: 0.1in;
            }
            .amounts-table td:last-child {
              width: 1.5in;
              text-align: right;
              padding-right: 0.1in;
            }
            .amounts-table tr:nth-child(3) td,
            .amounts-table tr:nth-child(4) td,
            .amounts-table tr:nth-child(5) td {
              font-weight: bold;
              font-size: 13pt;
            }
            .words {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 0.1in;
              font-family: Arial;
              line-height: 1.2;
              width: 4.5in;
              min-height: 0.4in;
              display: flex;
              align-items: center;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .remarks {
              font-size: 12pt;
              font-weight: bold;
              font-family: Arial;
              line-height: 1.2;
              width: 4.5in;
              min-height: 0.3in;
              display: flex;
              align-items: center;
            }
            .watermark {
              margin-top: -20px;
              padding-left: 0.3in;
              font-size: 80pt;
              font-weight: bold;
              color: lightgray;
              font-family: Arial;
            }
            .full-width-box {
              width: 7.5in;
              height: 0.3in;
              border-top: 1px solid black;
              border-left: 1px solid black;
              border-right: none;
              border-bottom: 1px solid black;
              margin-bottom: 0.1in;
            }
            .amounts-table tr:first-child td {
              border-top: none;
            }
          </style>
        </head>
        <body>
          ${pages.map((pageItems, pageIndex) => `
            <div class="print-page">
              <img src="${logo}" class="logo" alt="Logo" />
              <div class="header">
                <h1>Anchor Brand Drywall Screws</h1>
                <div class="invoice-info">
                  <span class="inv-no">Inv. No: ${invoiceNo}</span>
                  <span class="date">Date: ${new Date(date).toLocaleDateString()}</span>
                </div>
                <p>Bill To: ${customer}</p>
                <p>${area}</p>
              </div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Qty</th>
                    <th>Item Description</th>
                    <th>Sale Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageItems.map(item => `
                    <tr>
                      <td>${item.qty}</td>
                      <td>${item.itemDescription}</td>
                      <td>${item.rate.toFixed(2)}</td>
                      <td>${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                <div class="footer-left">
                  <div class="full-width-box"></div>
                  <div class="remarks">${remarks}</div>
                  <div class="watermark">Drywall</div>
                </div>
                <div class="footer-right">
                  <table class="amounts-table">
                    <tr>
                      <td>Total Amount</td>
                      <td>${netAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Discount % ${specialLess.toFixed(2)}</td>
                      <td>${lessAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Net Receivable</td>
                      <td>${receivable.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Previous Balance</td>
                      <td>${prevBalance.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Total Receivable</td>
                      <td>${totalAmount.toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>
            ${pageIndex < pages.length - 1 ? '<div class="page-break"></div>' : ''}
          `).join('')}
        </body>
      </html>
    `;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Write content to iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();

    // Wait for content to load and print
    iframe.onload = function() {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        window.print();
      }
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          width: '9in',
          maxHeight: '95vh',
          overflow: 'hidden',
          position: 'relative',
          p: 0
        }
      }}
    >
      <DialogTitle sx={{ p: 1 }}>Print Preview</DialogTitle>
      <DialogContent sx={{ 
        p: 0, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        }
      }}>
        {pages.map((pageItems, pageIndex) => (
          <Box key={pageIndex} sx={{ 
            width: '8.5in',
            minHeight: '11in',
            position: 'relative',
            p: 0,
            mb: 2,
          }}>
            {pageIndex === 0 && (
              <>
                <Box
                  component="img"
                  src={logo}
                  alt="Logo"
                  sx={{
                    position: 'absolute',
                    left: '0.25in',
                    top: '0.25in',
                    width: '1.5in',
                    height: '1.5in'
                  }}
                />

                <Box sx={{ 
                  position: 'absolute',
                  left: '2in',
                  top: '0.25in'
                }}>
                  <Typography variant="h1" sx={{ 
                    fontSize: '28pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    m: 0
                  }}>
                    Anchor Brand Drywall Screws
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '14pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    mt: 0.5
                  }}>
                    Inv. No: {invoiceNo}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '14pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    mt: 0.5
                  }}>
                    Date: {new Date(date).toLocaleDateString()}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '14pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    mt: 0.5
                  }}>
                    Bill To: {customer}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '14pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    mt: 0.5
                  }}>
                    {area}
                  </Typography>
                </Box>
              </>
            )}

            <Box sx={{ 
              position: 'absolute',
              left: '0.25in',
              top: pageIndex === 0 ? '2in' : '0.5in',
              width: '8in'
            }}>
              {pageIndex === 0 && (
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '0.8in 4.5in 1.2in 1.5in',
                  borderTop: '1px solid black',
                  borderLeft: '1px solid black'
                }}>
                  <Box sx={{ 
                    height: '0.4in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Qty
                  </Box>
                  <Box sx={{ 
                    height: '0.4in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    textAlign: 'left',
                    pl: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Item Description
                  </Box>
                  <Box sx={{ 
                    height: '0.4in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Sale Price
                  </Box>
                  <Box sx={{ 
                    height: '0.4in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Amount
                  </Box>
                </Box>
              )}

              {pageItems.map((item, index) => (
                <Box key={index} sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '0.8in 4.5in 1.2in 1.5in',
                  borderLeft: '1px solid black'
                }}>
                  <Box sx={{ 
                    height: '0.35in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontFamily: 'Arial',
                    textAlign: 'right',
                    pr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}>
                    {item.qty}
                  </Box>
                  <Box sx={{ 
                    height: '0.35in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontFamily: 'Arial',
                    textAlign: 'left',
                    pl: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.itemDescription}
                  </Box>
                  <Box sx={{ 
                    height: '0.35in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontFamily: 'Arial',
                    textAlign: 'right',
                    pr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}>
                    {item.rate.toFixed(2)}
                  </Box>
                  <Box sx={{ 
                    height: '0.35in',
                    borderRight: '1px solid black',
                    borderBottom: '1px solid black',
                    fontSize: '12pt',
                    fontFamily: 'Arial',
                    textAlign: 'right',
                    pr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}>
                    {item.amount.toFixed(2)}
                  </Box>
                </Box>
              ))}
            </Box>

            {pageIndex === pages.length - 1 && (
              <Box sx={{ 
                position: 'absolute',
                bottom: '1.5in',
                left: '0.25in',
                width: '8in'
              }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  width: '4.5in'
                }}>
                  <Box sx={{
                    width: '7.5in',
                    height: '0.3in',
                    borderTop: '1px solid black',
                    borderLeft: '1px solid black',
                    borderRight: 'none',
                    borderBottom: '1px solid black',
                    mb: '0.1in',
                  }} />
                  <Typography sx={{ 
                    fontSize: '12pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    mb: 1
                  }}>
                    {remarks}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '80pt',
                    fontWeight: 'bold',
                    fontFamily: 'Arial',
                    color: 'gray',
                    mt: 1
                  }}>
                    Drywall
                  </Typography>
                </Box>
                <Box sx={{ 
                  position: 'absolute',
                  right: 0,
                  width: '3.5in'
                }}>
                  <Box component="table" sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
                    <Box component="tbody">
                      <Box component="tr">
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '12pt', textAlign: 'right', pl: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', borderTop: 'none', width: '3.5in' }}>Total Amount</Box>
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '12pt', textAlign: 'right', pr: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '1.5in' }}>{netAmount.toFixed(2)}</Box>
                      </Box>
                      <Box component="tr">
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '12pt', textAlign: 'right', pl: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '3.5in' }}>Discount % {specialLess}</Box>
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '12pt', textAlign: 'right', pr: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '1.5in' }}>{lessAmount.toFixed(2)}</Box>
                      </Box>
                      <Box component="tr">
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right', pl: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '3.5in' }}>Net Receivable</Box>
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right', pr: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '1.5in' }}>{receivable.toFixed(2)}</Box>
                      </Box>
                      <Box component="tr">
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right', pl: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '3.5in' }}>Previous Balance</Box>
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right', pr: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '1.5in' }}>{prevBalance.toFixed(2)}</Box>
                      </Box>
                      <Box component="tr">
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right', pl: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '3.5in' }}>Total Receivable</Box>
                        <Box component="td" sx={{ height: '0.25in', border: '1px solid black', fontSize: '13pt', fontWeight: 'bold', textAlign: 'right', pr: '0.1in', fontFamily: 'Arial', verticalAlign: 'middle', width: '1.5in' }}>{totalAmount.toFixed(2)}</Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePrint} variant="contained" color="primary">
          Print
        </Button>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
