using Microsoft.Net.Http.Headers;
public static class streamService
{
    public static RangeHeaderValue GetRanges(this HttpContext context, long contentSize)
    {
        RangeHeaderValue rangesResult = null;

        string rangeHeader = context.Request.Headers["Range"];

        if (!string.IsNullOrEmpty(rangeHeader))
        {
            string[] ranges = rangeHeader.Replace("bytes=", string.Empty).Split(",".ToCharArray());

            rangesResult = new RangeHeaderValue();

            for (int i = 0; i < ranges.Length; i++)
            {
                const int START = 0, END = 1;

                long endByte, startByte;

                long parsedValue;

                string[] currentRange = ranges[i].Split("-".ToCharArray());

                if (long.TryParse(currentRange[END], out parsedValue))
                    endByte = parsedValue;
                else
                    endByte = contentSize - 1;


                if (long.TryParse(currentRange[START], out parsedValue))
                    startByte = parsedValue;
                else
                {
                    startByte = contentSize - endByte;
                    endByte = contentSize - 1;
                }

                rangesResult.Ranges.Add(new RangeItemHeaderValue(startByte, endByte));
            }
        }
        return rangesResult;
    }
}