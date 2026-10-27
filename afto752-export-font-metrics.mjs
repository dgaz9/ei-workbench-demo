/* Standard Times-Roman ASCII advance widths, units per 1000 em.
Derived from installed ReportLab 4.4.9 pdfbase/_fontdata_widths_timesroman.py
and its standard WinAnsi encoding using stringWidth(character, Times-Roman, 1000).
Source SHA256: 18328f25869055abe98487aadfd2e3dbe76ab26849b693b8165f00dcbe679f14
No font binary is embedded; no kerning reduction is applied.

#####################################################################################
#
#	Copyright (c) 2000-2024, ReportLab Inc.
#	All rights reserved.
#
#	Redistribution and use in source and binary forms, with or without modification,
#	are permitted provided that the following conditions are met:
#
#		*	Redistributions of source code must retain the above copyright notice,
#			this list of conditions and the following disclaimer. 
#		*	Redistributions in binary form must reproduce the above copyright notice,
#			this list of conditions and the following disclaimer in the documentation
#			and/or other materials provided with the distribution. 
#		*	Neither the name of the company nor the names of its contributors may be
#			used to endorse or promote products derived from this software without
#			specific prior written permission. 
#
#	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
#	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
#	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
#	IN NO EVENT SHALL THE OFFICERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
#	INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
#	TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
#	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
#	IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
#	IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
#	SUCH DAMAGE.
#
#####################################################################################

*/
export const TIMES_ASCII_WIDTHS = Object.freeze([250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541]);
export function measureAscii(text, size) {
  let units = 0;
  for (const ch of text) {
    const index = ch.charCodeAt(0) - 32;
    if (index < 0 || index >= TIMES_ASCII_WIDTHS.length) throw new Error('Unsupported ASCII glyph');
    units += TIMES_ASCII_WIDTHS[index];
  }
  return units * size / 1000;
}

// Retain whitespace and avoid negative kerning. Whole words wrap before their
// characters are split, preventing optimistic character-count line estimates.
export function measuredLines(text, size, width) {
  if (!(width > 0)) return Infinity;
  let lines = 0;
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    lines++;
    let used = 0;
    for (const token of paragraph.match(/ +|[^ ]+/g) || []) {
      const tokenWidth = measureAscii(token, size);
      if (used && used + tokenWidth > width) { lines++; used = 0; }
      for (const ch of token) {
        const advance = measureAscii(ch, size);
        if (advance > width) return Infinity;
        if (used + advance > width) { lines++; used = 0; }
        used += advance;
      }
    }
  }
  return lines;
}
