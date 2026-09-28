// P/Invoke bindings for reportbuilder.dll (C#, .NET 6+ / .NET Framework 4.7.2+).
//
//   var result = ReportBuilder.Render("Final.rbt.json", jsonText, @"C:\out\SN1.pdf", "{\"pdfa\":true}");
//
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class ReportBuilder
{
    private const string Lib = "reportbuilder";

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_version(byte[] buf, int len);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_render(byte[] templatePath, byte[] dataJson, byte[] outputPdf, byte[] optionsJson, byte[] result, int resultLen);

    [DllImport(Lib, CallingConvention = CallingConvention.Cdecl)]
    private static extern int rb_validate(byte[] templatePath, byte[] dataJson, byte[] result, int resultLen);

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

    /// <summary>Renders a PDF. Returns the JSON result; throws on failure.</summary>
    public static string Render(string templatePath, string dataJson, string outputPdf, string optionsJson = "")
    {
        var buf = new byte[64 * 1024];
        int code = rb_render(Z(templatePath), Z(dataJson), Z(outputPdf), Z(optionsJson), buf, buf.Length);
        string result = Read(buf);
        if (code != 0) throw new ReportBuilderException(code, result);
        return result;
    }

    /// <summary>Validates a template (optionally against data). Returns the JSON report.</summary>
    public static string Validate(string templatePath, string dataJson = "")
    {
        var buf = new byte[64 * 1024];
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
