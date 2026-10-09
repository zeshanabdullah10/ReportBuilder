// P/Invoke bindings for reportbuilder.dll (C#, .NET 6+ / .NET Framework 4.7.2+).
//
//   var result = ReportBuilder.Render("Final.rbt.json", jsonText, @"C:\out\SN1.pdf", "{\"pdfa\":true}");
//   ReportBuilder.RenderFile("Final.rbt.json", @"C:\data\SN1.csv", @"C:\out\SN1.pdf");
//   byte[] pdf = ReportBuilder.RenderToMemory(templateJson, dataJson, "{\"strict\":true}");
//
// Results are JSON strings, e.g. {"ok":true,"pages":2,"bytes":81234,"warnings":[],"issuesDetail":[],...}.
// Failures throw ReportBuilderException with the status code and the result JSON
// ({"ok":false,"stage":"...","error":"...",...}).
//
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class ReportBuilder
{
    private const string Lib = "reportbuilder";
    private const int ResultSize = 64 * 1024;

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_version(byte[] buf, int len);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_render(byte[] templatePath, byte[] dataJson, byte[] outputPdf, byte[] optionsJson, byte[] result, int resultLen);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_render_file(byte[] templatePath, byte[] dataPath, byte[] outputPdf, byte[] optionsJson, byte[] result, int resultLen);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_validate(byte[] templatePath, byte[] dataJson, byte[] result, int resultLen);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_render_to_memory(byte[] templateJson, byte[] dataJson, byte[] optionsJson,
                                                  out IntPtr outPdf, out UIntPtr outLen, byte[] result, int resultLen);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern void rb_free(IntPtr ptr, UIntPtr len);

    private static byte[] Z(string s) => Encoding.UTF8.GetBytes((s ?? string.Empty) + "\0");

    private static string Read(byte[] buf)
    {
        int n = Array.IndexOf(buf, (byte)0);
        return Encoding.UTF8.GetString(buf, 0, n < 0 ? buf.Length : n);
    }

    public static string Version()
    {
        var buf = new byte[64];
        rb_version(buf, buf.Length);
        return Read(buf);
    }

    /// <summary>Renders a PDF from JSON data text. Returns the JSON result; throws on failure.</summary>
    public static string Render(string templatePath, string dataJson, string outputPdf, string optionsJson = "")
    {
        var buf = new byte[ResultSize];
        int code = rb_render(Z(templatePath), Z(dataJson), Z(outputPdf), Z(optionsJson), buf, buf.Length);
        string result = Read(buf);
        if (code != 0) throw new ReportBuilderException(code, result);
        return result;
    }

    /// <summary>
    /// Renders a PDF from a data file (JSON, or CSV when the path ends in .csv).
    /// An empty <paramref name="dataPath"/> uses the template's sample data.
    /// Returns the JSON result; throws on failure.
    /// </summary>
    public static string RenderFile(string templatePath, string dataPath, string outputPdf, string optionsJson = "")
    {
        var buf = new byte[ResultSize];
        int code = rb_render_file(Z(templatePath), Z(dataPath), Z(outputPdf), Z(optionsJson), buf, buf.Length);
        string result = Read(buf);
        if (code != 0) throw new ReportBuilderException(code, result);
        return result;
    }

    /// <summary>
    /// Renders a template given as JSON text to PDF bytes in memory. Options are the same as for
    /// <see cref="Render"/> (pdfa, strict, now, fontDirs) plus "baseDir" for relative image paths.
    /// Throws on failure.
    /// </summary>
    public static byte[] RenderToMemory(string templateJson, string dataJson = "", string optionsJson = "")
    {
        return RenderToMemory(templateJson, dataJson, optionsJson, out _);
    }

    /// <summary>As <see cref="RenderToMemory(string,string,string)"/>, also returning the JSON result.</summary>
    public static byte[] RenderToMemory(string templateJson, string dataJson, string optionsJson, out string resultJson)
    {
        var buf = new byte[ResultSize];
        int code = rb_render_to_memory(Z(templateJson), Z(dataJson), Z(optionsJson), out IntPtr ptr, out UIntPtr len, buf, buf.Length);
        resultJson = Read(buf);
        try
        {
            if (code != 0 && code != -1) throw new ReportBuilderException(code, resultJson);
            if (ptr == IntPtr.Zero) throw new ReportBuilderException(code, resultJson);
            var pdf = new byte[checked((int)len.ToUInt64())];
            Marshal.Copy(ptr, pdf, 0, pdf.Length);
            return pdf;
        }
        finally
        {
            if (ptr != IntPtr.Zero) rb_free(ptr, len);
        }
    }

    /// <summary>Validates a template (optionally against data). Returns the JSON report.</summary>
    public static string Validate(string templatePath, string dataJson = "")
    {
        var buf = new byte[ResultSize];
        int code = rb_validate(Z(templatePath), Z(dataJson), buf, buf.Length);
        string result = Read(buf);
        if (code != 0 && code != 2) throw new ReportBuilderException(code, result);
        return result;
    }
}

public sealed class ReportBuilderException : Exception
{
    public int Code { get; }
    public string ResultJson { get; }

    public ReportBuilderException(int code, string resultJson) : base($"Report Builder failed with status {code}: {resultJson}")
    {
        Code = code;
        ResultJson = resultJson;
    }
}
